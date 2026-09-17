import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  BatchAssessmentSubmissionDto,
  BatchExamMarksDto,
  ModerateSectionGradesDto,
  ModerationAction,
  AmendGradeDto,
  GradeAppealDto,
  ReviewAppealDto,
} from './dto/grading.dto';
import {
  GradeWorkflowStatus,
  AcademicStanding,
  GradeAppealStatus,
  SystemRole,
  JwtPayload,
} from '@chuoms/common';
import { Decimal } from 'decimal.js';

export interface GradeBoundary {
  minScore: number;
  maxScore: number;
  letterGrade: string;
  gradePoint: number;
}

export const DEFAULT_GRADING_SCALE: GradeBoundary[] = [
  { minScore: 70, maxScore: 100, letterGrade: 'A', gradePoint: 4.0 },
  { minScore: 60, maxScore: 69.99, letterGrade: 'B', gradePoint: 3.0 },
  { minScore: 50, maxScore: 59.99, letterGrade: 'C', gradePoint: 2.0 },
  { minScore: 40, maxScore: 49.99, letterGrade: 'D', gradePoint: 1.0 },
  { minScore: 0, maxScore: 39.99, letterGrade: 'F', gradePoint: 0.0 },
];

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  // =========================================================================
  // UTILITY / GRADING COMPUTATION HELPERS
  // =========================================================================

  /**
   * Determine Letter Grade and Grade Point from total marks (0 - 100)
   */
  determineGrade(totalScore: number): { letterGrade: string; gradePoint: number } {
    const score = Math.round(Number(totalScore) * 100) / 100;
    for (const rule of DEFAULT_GRADING_SCALE) {
      if (score >= rule.minScore && score <= rule.maxScore) {
        return { letterGrade: rule.letterGrade, gradePoint: rule.gradePoint };
      }
    }
    if (score < 0) return { letterGrade: 'F', gradePoint: 0.0 };
    return { letterGrade: 'A', gradePoint: 4.0 }; // >= 100
  }

  /**
   * Recalculate and update the SemesterGrade for a given enrollment
   */
  async recalculateEnrollmentGrade(
    enrollmentId: string,
    txDb: any = this.db,
  ) {
    const enrollment = await txDb.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        classSection: {
          include: {
            assessments: {
              include: {
                submissions: {
                  where: { studentId: (await txDb.enrollment.findUnique({ where: { id: enrollmentId } }))?.studentId },
                },
              },
            },
          },
        },
        semesterGrade: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    const studentId = enrollment.studentId;
    const assessments = enrollment.classSection.assessments;

    // Calculate Continuous Assessment (CA) Marks
    // Exclude FINAL_EXAM from continuous assessment if separate
    let caMarks = new Decimal(0);
    for (const a of assessments) {
      if (a.assessmentType !== 'FINAL_EXAM') {
        const sub = a.submissions.find((s: any) => s.studentId === studentId);
        if (sub && Number(a.maxMarks) > 0) {
          // contribution = (marksObtained / maxMarks) * weightPercentage
          const contribution = new Decimal(sub.marksObtained)
            .dividedBy(new Decimal(a.maxMarks))
            .times(new Decimal(a.weightPercentage));
          caMarks = caMarks.plus(contribution);
        }
      }
    }

    const currentGrade = enrollment.semesterGrade;
    const examMarks = currentGrade ? new Decimal(currentGrade.examMarks) : new Decimal(0);
    const totalMarks = caMarks.plus(examMarks);
    const clampedTotal = Math.min(Math.max(Number(totalMarks.toFixed(2)), 0), 100);

    const { letterGrade, gradePoint } = this.determineGrade(clampedTotal);

    if (currentGrade) {
      return await txDb.semesterGrade.update({
        where: { id: currentGrade.id },
        data: {
          continuousAssessmentMarks: Number(caMarks.toFixed(2)),
          totalMarks: clampedTotal,
          letterGrade,
          gradePoint,
        },
      });
    } else {
      return await txDb.semesterGrade.create({
        data: {
          enrollmentId,
          continuousAssessmentMarks: Number(caMarks.toFixed(2)),
          examMarks: Number(examMarks.toFixed(2)),
          totalMarks: clampedTotal,
          letterGrade,
          gradePoint,
          workflowStatus: GradeWorkflowStatus.DRAFT,
        },
      });
    }
  }

  // =========================================================================
  // 1. ASSESSMENT MANAGEMENT (CATs, Quizzes, Labs, Exams)
  // =========================================================================

  /**
   * Create an Assessment for a Course Section with weight validation
   */
  async createAssessment(
    sectionId: string,
    dto: CreateAssessmentDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        assessments: true,
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    // Verify lecturer authorization if caller is lecturer
    this.assertLecturerOrAdmin(section, user);

    // Validate that grades are not already published/locked
    await this.assertSectionGradesEditable(sectionId);

    // Validate total weight percentage <= 100%
    const currentTotalWeight = section.assessments.reduce(
      (sum, a) => sum + Number(a.weightPercentage),
      0,
    );
    const newTotal = currentTotalWeight + Number(dto.weightPercentage);
    if (newTotal > 100.001) {
      throw new BadRequestException(
        `Total assessment weights cannot exceed 100%. Current: ${currentTotalWeight}%, Attempted to add: ${dto.weightPercentage}% (Sum: ${newTotal}%)`,
      );
    }

    const assessment = await this.db.assessment.create({
      data: {
        classSectionId: sectionId,
        name: dto.name,
        assessmentType: dto.assessmentType,
        maxMarks: dto.maxMarks,
        weightPercentage: dto.weightPercentage,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'CREATE_ASSESSMENT',
      resource: 'ASSESSMENT',
      resourceId: assessment.id,
      newValues: {
        sectionId,
        name: dto.name,
        type: dto.assessmentType,
        weight: dto.weightPercentage,
        maxMarks: dto.maxMarks,
      },
      ipAddress,
      userAgent,
      reason: `Created assessment "${dto.name}" (${dto.weightPercentage}%) for section ${sectionId}`,
    });

    return assessment;
  }

  /**
   * List all assessments for a class section
   */
  async getAssessmentsBySection(sectionId: string) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        assessments: {
          include: {
            _count: {
              select: { submissions: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    return section.assessments.map((a) => ({
      ...a,
      submissionCount: a._count.submissions,
    }));
  }

  /**
   * Update an assessment
   */
  async updateAssessment(
    assessmentId: string,
    dto: UpdateAssessmentDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const assessment = await this.db.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        classSection: {
          include: { assessments: true },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    this.assertLecturerOrAdmin(assessment.classSection, user);
    await this.assertSectionGradesEditable(assessment.classSectionId);

    // If weight updated, validate total <= 100%
    if (dto.weightPercentage !== undefined) {
      const otherWeights = assessment.classSection.assessments
        .filter((a) => a.id !== assessmentId)
        .reduce((sum, a) => sum + Number(a.weightPercentage), 0);
      const updatedTotal = otherWeights + Number(dto.weightPercentage);
      if (updatedTotal > 100.001) {
        throw new BadRequestException(
          `Total assessment weights cannot exceed 100%. Other: ${otherWeights}%, Updated: ${dto.weightPercentage}% (Sum: ${updatedTotal}%)`,
        );
      }
    }

    const updated = await this.db.assessment.update({
      where: { id: assessmentId },
      data: {
        name: dto.name ?? undefined,
        assessmentType: dto.assessmentType ?? undefined,
        maxMarks: dto.maxMarks !== undefined ? dto.maxMarks : undefined,
        weightPercentage: dto.weightPercentage !== undefined ? dto.weightPercentage : undefined,
        dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
      },
    });

    // Recalculate CA for all enrollments in section if weight or maxMarks changed
    if (dto.weightPercentage !== undefined || dto.maxMarks !== undefined) {
      const enrollments = await this.db.enrollment.findMany({
        where: { classSectionId: assessment.classSectionId, status: 'ENROLLED' },
      });
      for (const e of enrollments) {
        await this.recalculateEnrollmentGrade(e.id);
      }
    }

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'UPDATE_ASSESSMENT',
      resource: 'ASSESSMENT',
      resourceId: assessmentId,
      oldValues: {
        name: assessment.name,
        weight: assessment.weightPercentage,
        maxMarks: assessment.maxMarks,
      },
      newValues: {
        name: updated.name,
        weight: updated.weightPercentage,
        maxMarks: updated.maxMarks,
      },
      ipAddress,
      userAgent,
      reason: `Updated assessment ${assessmentId}`,
    });

    return updated;
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(
    assessmentId: string,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const assessment = await this.db.assessment.findUnique({
      where: { id: assessmentId },
      include: { classSection: true },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    this.assertLecturerOrAdmin(assessment.classSection, user);
    await this.assertSectionGradesEditable(assessment.classSectionId);

    await this.db.assessment.delete({ where: { id: assessmentId } });

    // Recalculate enrollments
    const enrollments = await this.db.enrollment.findMany({
      where: { classSectionId: assessment.classSectionId, status: 'ENROLLED' },
    });
    for (const e of enrollments) {
      await this.recalculateEnrollmentGrade(e.id);
    }

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'DELETE_ASSESSMENT',
      resource: 'ASSESSMENT',
      resourceId: assessmentId,
      oldValues: { name: assessment.name, weight: assessment.weightPercentage },
      ipAddress,
      userAgent,
      reason: `Deleted assessment ${assessmentId}`,
    });

    return { success: true, message: `Assessment ${assessment.name} deleted successfully.` };
  }

  // =========================================================================
  // 2. ASSESSMENT SUBMISSIONS & MARKS ENTRY
  // =========================================================================

  /**
   * Batch record or update marks obtained for an assessment
   */
  async batchSubmitAssessmentMarks(
    assessmentId: string,
    dto: BatchAssessmentSubmissionDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const assessment = await this.db.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        classSection: {
          include: {
            enrollments: {
              where: { status: 'ENROLLED' },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    this.assertLecturerOrAdmin(assessment.classSection, user);
    await this.assertSectionGradesEditable(assessment.classSectionId);

    const enrolledStudentIds = new Set(
      assessment.classSection.enrollments.map((e) => e.studentId),
    );

    const maxMarks = Number(assessment.maxMarks);

    // Validate submissions
    for (const sub of dto.submissions) {
      if (!enrolledStudentIds.has(sub.studentId)) {
        throw new BadRequestException(
          `Student ${sub.studentId} is not actively enrolled in class section ${assessment.classSectionId}`,
        );
      }
      if (sub.marksObtained < 0 || sub.marksObtained > maxMarks) {
        throw new BadRequestException(
          `Marks obtained (${sub.marksObtained}) must be between 0 and maxMarks (${maxMarks}) for student ${sub.studentId}`,
        );
      }
    }

    const staffId = user.staffId || user.sub;

    // Process submissions in a transaction
    await this.db.$transaction(async (tx) => {
      for (const sub of dto.submissions) {
        await tx.assessmentSubmission.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId,
              studentId: sub.studentId,
            },
          },
          create: {
            assessmentId,
            studentId: sub.studentId,
            marksObtained: sub.marksObtained,
            feedback: sub.feedback,
            gradedBy: staffId,
          },
          update: {
            marksObtained: sub.marksObtained,
            feedback: sub.feedback,
            gradedBy: staffId,
            gradedAt: new Date(),
          },
        });

        // Recalculate SemesterGrade for this student's enrollment
        const enrollment = assessment.classSection.enrollments.find(
          (e) => e.studentId === sub.studentId,
        );
        if (enrollment) {
          await this.recalculateEnrollmentGrade(enrollment.id, tx);
        }
      }
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'BATCH_ASSESSMENT_SUBMISSION',
      resource: 'ASSESSMENT_SUBMISSION',
      resourceId: assessmentId,
      newValues: { count: dto.submissions.length, assessmentId },
      ipAddress,
      userAgent,
      reason: `Recorded marks for ${dto.submissions.length} students on assessment ${assessment.name}`,
    });

    return {
      success: true,
      message: `Successfully recorded assessment marks for ${dto.submissions.length} students.`,
    };
  }

  /**
   * Batch record or update final examination marks for section roster
   */
  async batchSubmitExamMarks(
    sectionId: string,
    dto: BatchExamMarksDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        enrollments: {
          where: { status: 'ENROLLED' },
          include: { semesterGrade: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    this.assertLecturerOrAdmin(section, user);
    await this.assertSectionGradesEditable(sectionId);

    const enrollmentMap = new Map<string, any>();
    for (const e of section.enrollments) {
      enrollmentMap.set(e.studentId, e);
    }

    // Validate entries
    for (const entry of dto.entries) {
      if (!enrollmentMap.has(entry.studentId)) {
        throw new BadRequestException(
          `Student ${entry.studentId} is not actively enrolled in class section ${sectionId}`,
        );
      }
      if (entry.examMarks < 0 || entry.examMarks > 100) {
        throw new BadRequestException(
          `Exam marks (${entry.examMarks}) must be between 0 and 100 for student ${entry.studentId}`,
        );
      }
    }

    await this.db.$transaction(async (tx) => {
      for (const entry of dto.entries) {
        const enrollment = enrollmentMap.get(entry.studentId);
        const caMarks = enrollment.semesterGrade
          ? Number(enrollment.semesterGrade.continuousAssessmentMarks)
          : 0;
        const totalMarks = Math.min(Math.max(caMarks + entry.examMarks, 0), 100);
        const { letterGrade, gradePoint } = this.determineGrade(totalMarks);

        if (enrollment.semesterGrade) {
          await tx.semesterGrade.update({
            where: { id: enrollment.semesterGrade.id },
            data: {
              examMarks: entry.examMarks,
              totalMarks,
              letterGrade,
              gradePoint,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.semesterGrade.create({
            data: {
              enrollmentId: enrollment.id,
              continuousAssessmentMarks: caMarks,
              examMarks: entry.examMarks,
              totalMarks,
              letterGrade,
              gradePoint,
              workflowStatus: GradeWorkflowStatus.DRAFT,
            },
          });
        }
      }
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'BATCH_EXAM_MARKS_SUBMISSION',
      resource: 'SEMESTER_GRADE',
      resourceId: sectionId,
      newValues: { count: dto.entries.length, sectionId },
      ipAddress,
      userAgent,
      reason: `Recorded exam marks for ${dto.entries.length} students in section ${sectionId}`,
    });

    return {
      success: true,
      message: `Successfully recorded exam marks for ${dto.entries.length} students.`,
    };
  }

  // =========================================================================
  // 3. GRADEBOOK & WORKFLOW STATE MACHINE
  // =========================================================================

  /**
   * Get complete gradebook for a section
   */
  async getSectionGradebook(sectionId: string, user: JwtPayload) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        semester: true,
        primaryLecturer: {
          include: { user: true },
        },
        assessments: {
          orderBy: { createdAt: 'asc' },
          include: {
            submissions: true,
          },
        },
        enrollments: {
          where: { status: 'ENROLLED' },
          include: {
            student: {
              include: { user: true, program: true },
            },
            semesterGrade: true,
          },
          orderBy: {
            student: { admissionNumber: 'asc' },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    // Determine workflow status of section
    const grades = section.enrollments
      .map((e) => e.semesterGrade)
      .filter((g): g is NonNullable<typeof g> => g !== null);

    let sectionStatus: string = GradeWorkflowStatus.DRAFT;
    if (grades.length > 0) {
      // If any grade is DRAFT -> DRAFT, if all SUBMITTED -> SUBMITTED, etc.
      const statuses = new Set(grades.map((g) => g.workflowStatus));
      if (statuses.has(GradeWorkflowStatus.DRAFT)) {
        sectionStatus = GradeWorkflowStatus.DRAFT;
      } else if (statuses.has(GradeWorkflowStatus.SUBMITTED)) {
        sectionStatus = GradeWorkflowStatus.SUBMITTED;
      } else if (statuses.has(GradeWorkflowStatus.MODERATED)) {
        sectionStatus = GradeWorkflowStatus.MODERATED;
      } else if (statuses.has(GradeWorkflowStatus.APPROVED)) {
        sectionStatus = GradeWorkflowStatus.APPROVED;
      } else if (statuses.has(GradeWorkflowStatus.PUBLISHED)) {
        sectionStatus = GradeWorkflowStatus.PUBLISHED;
      }
    }

    // Map roster with assessment scores and overall grade
    const roster = section.enrollments.map((e) => {
      const student = e.student;
      const submissionMap = new Map<string, number>();
      for (const a of section.assessments) {
        const sub = a.submissions.find((s) => s.studentId === student.id);
        if (sub) {
          submissionMap.set(a.id, Number(sub.marksObtained));
        }
      }

      return {
        enrollmentId: e.id,
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        programCode: student.program.code,
        assessmentScores: Object.fromEntries(submissionMap),
        continuousAssessmentMarks: e.semesterGrade ? Number(e.semesterGrade.continuousAssessmentMarks) : 0,
        examMarks: e.semesterGrade ? Number(e.semesterGrade.examMarks) : 0,
        totalMarks: e.semesterGrade ? Number(e.semesterGrade.totalMarks) : 0,
        letterGrade: e.semesterGrade ? e.semesterGrade.letterGrade : 'N/A',
        gradePoint: e.semesterGrade ? Number(e.semesterGrade.gradePoint) : 0.0,
        workflowStatus: e.semesterGrade ? e.semesterGrade.workflowStatus : GradeWorkflowStatus.DRAFT,
        remarks: e.semesterGrade?.remarks || null,
        appealStatus: e.semesterGrade?.appealStatus || null,
        appealReason: e.semesterGrade?.appealReason || null,
      };
    });

    // Statistical summary
    const validGrades = roster.filter((r) => r.totalMarks > 0);
    const meanMarks = validGrades.length > 0
      ? validGrades.reduce((sum, r) => sum + r.totalMarks, 0) / validGrades.length
      : 0;
    const passCount = validGrades.filter((r) => r.letterGrade !== 'F').length;
    const passRate = validGrades.length > 0 ? (passCount / validGrades.length) * 100 : 0;

    return {
      sectionId: section.id,
      sectionName: section.sectionName,
      courseCode: section.course.code,
      courseTitle: section.course.title,
      creditHours: section.course.creditHours,
      semesterCode: section.semester.code,
      lecturerName: section.primaryLecturer
        ? `${section.primaryLecturer.user.firstName} ${section.primaryLecturer.user.lastName}`
        : 'Unassigned',
      workflowStatus: sectionStatus,
      assessments: section.assessments.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.assessmentType,
        maxMarks: Number(a.maxMarks),
        weightPercentage: Number(a.weightPercentage),
      })),
      statistics: {
        totalEnrolled: section.enrollments.length,
        gradedCount: validGrades.length,
        meanMarks: Math.round(meanMarks * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      },
      roster,
    };
  }

  /**
   * Transition 1: SUBMIT SECTION GRADES (Lecturer formal sign-off)
   * Status: DRAFT -> SUBMITTED
   */
  async submitSectionGrades(
    sectionId: string,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        enrollments: {
          where: { status: 'ENROLLED' },
          include: { semesterGrade: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    this.assertLecturerOrAdmin(section, user);

    if (section.enrollments.length === 0) {
      throw new BadRequestException('Cannot submit grades for section with 0 enrolled students');
    }

    // Ensure all enrolled students have semester grade records
    for (const e of section.enrollments) {
      if (!e.semesterGrade) {
        await this.recalculateEnrollmentGrade(e.id);
      }
    }

    // Validate that current status is DRAFT
    const nonDraft = section.enrollments.some(
      (e) => e.semesterGrade && e.semesterGrade.workflowStatus !== GradeWorkflowStatus.DRAFT,
    );
    if (nonDraft) {
      throw new BadRequestException(
        'Section grades are already submitted, moderated, or published and cannot be re-submitted from current state.',
      );
    }

    const enrollmentIds = section.enrollments.map((e) => e.id);

    await this.db.semesterGrade.updateMany({
      where: { enrollmentId: { in: enrollmentIds } },
      data: {
        workflowStatus: GradeWorkflowStatus.SUBMITTED,
        submittedBy: user.sub,
        submittedAt: new Date(),
        remarks: null,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'SUBMIT_GRADES',
      resource: 'SEMESTER_GRADE',
      resourceId: sectionId,
      newValues: { status: GradeWorkflowStatus.SUBMITTED, count: enrollmentIds.length },
      ipAddress,
      userAgent,
      reason: `Lecturer formally submitted grades for section ${sectionId} to Department HoD`,
    });

    return {
      success: true,
      message: `Section grades submitted successfully for ${enrollmentIds.length} students.`,
      status: GradeWorkflowStatus.SUBMITTED,
    };
  }

  /**
   * Transition 2: MODERATE SECTION GRADES (Department HoD / Exam Officer)
   * Status: SUBMITTED -> MODERATED or SUBMITTED -> DRAFT (Revision Requested)
   */
  async moderateSectionGrades(
    sectionId: string,
    dto: ModerateSectionGradesDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        enrollments: {
          where: { status: 'ENROLLED' },
          include: { semesterGrade: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    const enrollmentIds = section.enrollments.map((e) => e.id);
    const unsubmitted = section.enrollments.some(
      (e) => !e.semesterGrade || e.semesterGrade.workflowStatus !== GradeWorkflowStatus.SUBMITTED,
    );

    if (unsubmitted) {
      throw new BadRequestException(
        'All section grades must be in SUBMITTED status before moderation can occur.',
      );
    }

    if (dto.action === ModerationAction.REQUEST_REVISION) {
      if (!dto.remarks || dto.remarks.trim().length < 5) {
        throw new BadRequestException(
          'Specific remarks detailing required corrections must be provided when requesting revisions.',
        );
      }

      await this.db.semesterGrade.updateMany({
        where: { enrollmentId: { in: enrollmentIds } },
        data: {
          workflowStatus: GradeWorkflowStatus.DRAFT,
          remarks: `[Revision Requested by ${user.email}]: ${dto.remarks}`,
        },
      });

      await this.auditService.log({
        userId: user.sub,
        userEmail: user.email,
        action: 'REQUEST_GRADE_REVISION',
        resource: 'SEMESTER_GRADE',
        resourceId: sectionId,
        newValues: { status: GradeWorkflowStatus.DRAFT, remarks: dto.remarks },
        ipAddress,
        userAgent,
        reason: `Department HoD requested revision: ${dto.remarks}`,
      });

      return {
        success: true,
        message: 'Revisions requested. Section returned to DRAFT state for lecturer correction.',
        status: GradeWorkflowStatus.DRAFT,
      };
    }

    // Action: APPROVE_MODERATION
    await this.db.semesterGrade.updateMany({
      where: { enrollmentId: { in: enrollmentIds } },
      data: {
        workflowStatus: GradeWorkflowStatus.MODERATED,
        moderatedBy: user.sub,
        moderatedAt: new Date(),
        remarks: dto.remarks || null,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'MODERATE_GRADES',
      resource: 'SEMESTER_GRADE',
      resourceId: sectionId,
      newValues: { status: GradeWorkflowStatus.MODERATED, remarks: dto.remarks },
      ipAddress,
      userAgent,
      reason: `Department HoD moderated and verified section grades for ${sectionId}`,
    });

    return {
      success: true,
      message: 'Grades successfully moderated and signed off by Department HoD.',
      status: GradeWorkflowStatus.MODERATED,
    };
  }

  /**
   * Transition 3: APPROVE SECTION GRADES (Dean / Exam Committee)
   * Status: MODERATED -> APPROVED
   */
  async approveSectionGrades(
    sectionId: string,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        enrollments: {
          where: { status: 'ENROLLED' },
          include: { semesterGrade: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    const enrollmentIds = section.enrollments.map((e) => e.id);
    const notModerated = section.enrollments.some(
      (e) => !e.semesterGrade || e.semesterGrade.workflowStatus !== GradeWorkflowStatus.MODERATED,
    );

    if (notModerated) {
      throw new BadRequestException(
        'All section grades must be in MODERATED status before Faculty Dean approval.',
      );
    }

    await this.db.semesterGrade.updateMany({
      where: { enrollmentId: { in: enrollmentIds } },
      data: {
        workflowStatus: GradeWorkflowStatus.APPROVED,
        approvedBy: user.sub,
        approvedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'APPROVE_GRADES',
      resource: 'SEMESTER_GRADE',
      resourceId: sectionId,
      newValues: { status: GradeWorkflowStatus.APPROVED },
      ipAddress,
      userAgent,
      reason: `Dean approved section grades for section ${sectionId}`,
    });

    return {
      success: true,
      message: 'Grades successfully approved by Faculty Dean.',
      status: GradeWorkflowStatus.APPROVED,
    };
  }

  /**
   * Transition 4: PUBLISH SECTION GRADES (Registrar)
   * Status: APPROVED -> PUBLISHED
   * Auto-triggers GPA calculation and Academic Progression update!
   */
  async publishSectionGrades(
    sectionId: string,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        enrollments: {
          where: { status: 'ENROLLED' },
          include: { semesterGrade: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Class section ${sectionId} not found`);
    }

    const enrollmentIds = section.enrollments.map((e) => e.id);
    const notApproved = section.enrollments.some(
      (e) => !e.semesterGrade || e.semesterGrade.workflowStatus !== GradeWorkflowStatus.APPROVED,
    );

    if (notApproved) {
      throw new BadRequestException(
        'All section grades must be APPROVED by Dean before Registrar publication.',
      );
    }

    await this.db.semesterGrade.updateMany({
      where: { enrollmentId: { in: enrollmentIds } },
      data: {
        workflowStatus: GradeWorkflowStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Auto-compute GPA & Academic Progression for all enrolled students in this semester
    for (const e of section.enrollments) {
      await this.calculateStudentProgression(e.studentId, section.semesterId);
    }

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'PUBLISH_GRADES',
      resource: 'SEMESTER_GRADE',
      resourceId: sectionId,
      newValues: { status: GradeWorkflowStatus.PUBLISHED, count: enrollmentIds.length },
      ipAddress,
      userAgent,
      reason: `Registrar published final official grades for section ${sectionId}`,
    });

    return {
      success: true,
      message: `Successfully published grades for ${enrollmentIds.length} students. GPA and Academic Progression recalculated.`,
      status: GradeWorkflowStatus.PUBLISHED,
    };
  }

  // =========================================================================
  // 4. ELEVATED GRADE AMENDMENT & APPEALS
  // =========================================================================

  /**
   * Elevated amendment of published grades with strict audit trail
   */
  async amendPublishedGrade(
    gradeId: string,
    dto: AmendGradeDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const grade = await this.db.semesterGrade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: {
          include: { classSection: true },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException(`SemesterGrade ${gradeId} not found`);
    }

    if (grade.workflowStatus !== GradeWorkflowStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only PUBLISHED grades can be amended through the elevated amendment workflow.',
      );
    }

    const oldValues = {
      continuousAssessmentMarks: Number(grade.continuousAssessmentMarks),
      examMarks: Number(grade.examMarks),
      totalMarks: Number(grade.totalMarks),
      letterGrade: grade.letterGrade,
      gradePoint: Number(grade.gradePoint),
      lockVersion: grade.lockVersion,
    };

    const newCa = dto.continuousAssessmentMarks !== undefined
      ? dto.continuousAssessmentMarks
      : Number(grade.continuousAssessmentMarks);
    const newExam = dto.examMarks !== undefined
      ? dto.examMarks
      : Number(grade.examMarks);
    const newTotal = Math.min(Math.max(newCa + newExam, 0), 100);
    const { letterGrade, gradePoint } = this.determineGrade(newTotal);

    const updatedGrade = await this.db.semesterGrade.update({
      where: { id: gradeId },
      data: {
        continuousAssessmentMarks: newCa,
        examMarks: newExam,
        totalMarks: newTotal,
        letterGrade,
        gradePoint,
        lockVersion: grade.lockVersion + 1,
        remarks: `[Amended by ${user.email}]: ${dto.reason}`,
      },
    });

    // Recalculate GPA & Academic Progression for student
    await this.calculateStudentProgression(
      grade.enrollment.studentId,
      grade.enrollment.semesterId,
    );

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'AMEND_PUBLISHED_GRADE',
      resource: 'SEMESTER_GRADE',
      resourceId: gradeId,
      oldValues,
      newValues: {
        continuousAssessmentMarks: newCa,
        examMarks: newExam,
        totalMarks: newTotal,
        letterGrade,
        gradePoint,
        reason: dto.reason,
        lockVersion: updatedGrade.lockVersion,
      },
      ipAddress,
      userAgent,
      reason: dto.reason,
    });

    return updatedGrade;
  }

  /**
   * Student submits a grade appeal for published grade
   */
  async submitGradeAppeal(
    gradeId: string,
    dto: GradeAppealDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const grade = await this.db.semesterGrade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: true,
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade ${gradeId} not found`);
    }

    if (grade.workflowStatus !== GradeWorkflowStatus.PUBLISHED) {
      throw new BadRequestException('Appeals can only be lodged against PUBLISHED grades.');
    }

    // Verify student ownership
    if (user.studentId && grade.enrollment.studentId !== user.studentId) {
      throw new ForbiddenException('You can only appeal your own grades.');
    }

    if (grade.appealStatus === GradeAppealStatus.PENDING || grade.appealStatus === GradeAppealStatus.UNDER_REVIEW) {
      throw new BadRequestException('A grade appeal is already active and pending for this course.');
    }

    const updated = await this.db.semesterGrade.update({
      where: { id: gradeId },
      data: {
        appealStatus: GradeAppealStatus.PENDING,
        appealReason: dto.reason,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'SUBMIT_GRADE_APPEAL',
      resource: 'SEMESTER_GRADE',
      resourceId: gradeId,
      newValues: { appealStatus: GradeAppealStatus.PENDING, reason: dto.reason },
      ipAddress,
      userAgent,
      reason: `Student filed grade appeal: ${dto.reason}`,
    });

    return updated;
  }

  /**
   * Faculty / Exam Committee reviews grade appeal
   */
  async reviewGradeAppeal(
    gradeId: string,
    dto: ReviewAppealDto,
    user: JwtPayload,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const grade = await this.db.semesterGrade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: true,
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade ${gradeId} not found`);
    }

    if (!grade.appealStatus) {
      throw new BadRequestException('No active appeal found for this grade.');
    }

    const oldValues = {
      appealStatus: grade.appealStatus,
      totalMarks: Number(grade.totalMarks),
      letterGrade: grade.letterGrade,
    };

    let updatedData: any = {
      appealStatus: dto.status,
      appealResolution: dto.resolution,
    };

    if (dto.status === GradeAppealStatus.APPROVED) {
      const caMarks = dto.newContinuousAssessmentMarks !== undefined
        ? dto.newContinuousAssessmentMarks
        : Number(grade.continuousAssessmentMarks);
      const examMarks = dto.newExamMarks !== undefined
        ? dto.newExamMarks
        : Number(grade.examMarks);
      const totalMarks = Math.min(Math.max(caMarks + examMarks, 0), 100);
      const { letterGrade, gradePoint } = this.determineGrade(totalMarks);

      updatedData = {
        ...updatedData,
        continuousAssessmentMarks: caMarks,
        examMarks,
        totalMarks,
        letterGrade,
        gradePoint,
        lockVersion: grade.lockVersion + 1,
        remarks: `[Appeal Approved by ${user.email}]: ${dto.resolution}`,
      };
    }

    const updatedGrade = await this.db.semesterGrade.update({
      where: { id: gradeId },
      data: updatedData,
    });

    if (dto.status === GradeAppealStatus.APPROVED) {
      await this.calculateStudentProgression(
        grade.enrollment.studentId,
        grade.enrollment.semesterId,
      );
    }

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'RESOLVE_GRADE_APPEAL',
      resource: 'SEMESTER_GRADE',
      resourceId: gradeId,
      oldValues,
      newValues: {
        appealStatus: dto.status,
        resolution: dto.resolution,
        totalMarks: updatedGrade.totalMarks,
      },
      ipAddress,
      userAgent,
      reason: `Grade appeal ${dto.status}: ${dto.resolution}`,
    });

    return updatedGrade;
  }

  // =========================================================================
  // 5. GPA & ACADEMIC PROGRESSION ENGINE
  // =========================================================================

  /**
   * Calculate SGPA, CGPA, and Academic Standing for a specific student in a semester
   */
  async calculateStudentProgression(studentId: string, semesterId: string) {
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      include: { program: true },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const targetSemester = await this.db.semester.findUnique({
      where: { id: semesterId },
    });

    if (!targetSemester) {
      throw new NotFoundException(`Semester ${semesterId} not found`);
    }

    // 1. Current Semester Grades (Only PUBLISHED grades count toward official GPA)
    const semesterEnrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        semesterId,
        status: 'ENROLLED',
        semesterGrade: {
          workflowStatus: GradeWorkflowStatus.PUBLISHED,
        },
      },
      include: {
        classSection: {
          include: { course: true },
        },
        semesterGrade: true,
      },
    });

    let semesterQualityPoints = new Decimal(0);
    let semesterCreditsAttempted = 0;
    let semesterCreditsEarned = 0;

    for (const e of semesterEnrollments) {
      if (e.semesterGrade) {
        const credits = e.classSection.course.creditHours;
        const gp = new Decimal(e.semesterGrade.gradePoint);
        semesterQualityPoints = semesterQualityPoints.plus(gp.times(credits));
        semesterCreditsAttempted += credits;
        if (e.semesterGrade.letterGrade !== 'F') {
          semesterCreditsEarned += credits;
        }
      }
    }

    const sgpa = semesterCreditsAttempted > 0
      ? Number(semesterQualityPoints.dividedBy(semesterCreditsAttempted).toFixed(2))
      : 0.0;

    // 2. Cumulative Calculation across all past & present semesters up to target semester
    const allEnrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        status: 'ENROLLED',
        semesterGrade: {
          workflowStatus: GradeWorkflowStatus.PUBLISHED,
        },
        semester: {
          startDate: { lte: targetSemester.startDate },
        },
      },
      include: {
        classSection: {
          include: { course: true },
        },
        semesterGrade: true,
      },
    });

    // Handle repeated courses: group by courseId, take highest gradePoint
    const courseAttempts = new Map<string, { credits: number; highestGp: number; passed: boolean }>();
    for (const e of allEnrollments) {
      if (e.semesterGrade) {
        const courseId = e.classSection.courseId;
        const credits = e.classSection.course.creditHours;
        const gp = Number(e.semesterGrade.gradePoint);
        const isPassed = e.semesterGrade.letterGrade !== 'F';

        if (!courseAttempts.has(courseId)) {
          courseAttempts.set(courseId, { credits, highestGp: gp, passed: isPassed });
        } else {
          const current = courseAttempts.get(courseId)!;
          if (gp > current.highestGp) {
            courseAttempts.set(courseId, { credits, highestGp: gp, passed: isPassed });
          }
        }
      }
    }

    let cumQualityPoints = new Decimal(0);
    let cumCreditsAttempted = 0;
    let cumCreditsEarned = 0;

    for (const [, item] of courseAttempts.entries()) {
      cumQualityPoints = cumQualityPoints.plus(new Decimal(item.highestGp).times(item.credits));
      cumCreditsAttempted += item.credits;
      if (item.passed) {
        cumCreditsEarned += item.credits;
      }
    }

    const cgpa = cumCreditsAttempted > 0
      ? Number(cumQualityPoints.dividedBy(cumCreditsAttempted).toFixed(2))
      : 0.0;

    // 3. Determine Academic Standing
    // Previous progression history
    const previousProgression = await this.db.academicProgression.findFirst({
      where: {
        studentId,
        semester: {
          startDate: { lt: targetSemester.startDate },
        },
      },
      orderBy: { evaluatedAt: 'desc' },
    });

    let academicStanding: AcademicStanding = AcademicStanding.GOOD_STANDING;

    if (cgpa >= 2.0) {
      academicStanding = AcademicStanding.GOOD_STANDING;
    } else if (cgpa >= 1.75 && cgpa < 2.0) {
      academicStanding = AcademicStanding.ACADEMIC_WARNING;
    } else if (cgpa >= 1.0 && cgpa < 1.75) {
      if (previousProgression && (previousProgression.academicStanding === AcademicStanding.PROBATION || previousProgression.academicStanding === AcademicStanding.SUSPENDED)) {
        academicStanding = AcademicStanding.SUSPENDED;
      } else {
        academicStanding = AcademicStanding.PROBATION;
      }
    } else {
      // CGPA < 1.0
      academicStanding = AcademicStanding.SUSPENDED;
    }

    // 4. Upsert AcademicProgression
    const progression = await this.db.academicProgression.upsert({
      where: {
        studentId_semesterId: {
          studentId,
          semesterId,
        },
      },
      create: {
        studentId,
        semesterId,
        creditsAttempted: semesterCreditsAttempted,
        creditsEarned: semesterCreditsEarned,
        sgpa,
        cgpa,
        academicStanding,
        evaluatedAt: new Date(),
      },
      update: {
        creditsAttempted: semesterCreditsAttempted,
        creditsEarned: semesterCreditsEarned,
        sgpa,
        cgpa,
        academicStanding,
        evaluatedAt: new Date(),
      },
    });

    return progression;
  }

  /**
   * Batch recalculate SGPA, CGPA and Academic Standing for all students in a semester
   */
  async calculateSemesterProgression(semesterId: string, studentId?: string) {
    if (studentId) {
      return await this.calculateStudentProgression(studentId, semesterId);
    }

    const enrollments = await this.db.enrollment.findMany({
      where: { semesterId, status: 'ENROLLED' },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    const results = [];
    for (const e of enrollments) {
      const p = await this.calculateStudentProgression(e.studentId, semesterId);
      results.push(p);
    }

    return {
      success: true,
      processedCount: results.length,
      progressions: results,
    };
  }

  // =========================================================================
  // 6. TRANSCRIPTS & STUDENT VIEWS
  // =========================================================================

  /**
   * Generate Full Academic Transcript
   */
  async getStudentTranscript(studentId: string, isOfficial = false) {
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        program: {
          include: { department: { include: { faculty: true } } },
        },
        campus: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    // Get all completed enrollments with published grades ordered by semester
    const enrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        status: 'ENROLLED',
        semesterGrade: {
          workflowStatus: GradeWorkflowStatus.PUBLISHED,
        },
      },
      include: {
        semester: { include: { academicYear: true } },
        classSection: { include: { course: true } },
        semesterGrade: true,
      },
      orderBy: [
        { semester: { startDate: 'asc' } },
        { classSection: { course: { code: 'asc' } } },
      ],
    });

    // Group by semester
    const semesterMap = new Map<string, any>();
    for (const e of enrollments) {
      const semId = e.semesterId;
      if (!semesterMap.has(semId)) {
        semesterMap.set(semId, {
          semesterId: semId,
          semesterName: e.semester.name,
          semesterCode: e.semester.code,
          academicYear: e.semester.academicYear.name,
          courses: [],
        });
      }
      semesterMap.get(semId).courses.push({
        courseCode: e.classSection.course.code,
        courseTitle: e.classSection.course.title,
        creditHours: e.classSection.course.creditHours,
        totalMarks: Number(e.semesterGrade!.totalMarks),
        letterGrade: e.semesterGrade!.letterGrade,
        gradePoint: Number(e.semesterGrade!.gradePoint),
      });
    }

    // Fetch progression records for each semester
    const progressions = await this.db.academicProgression.findMany({
      where: { studentId },
      orderBy: { semester: { startDate: 'asc' } },
      include: { semester: true },
    });

    const progressionMap = new Map<string, any>();
    for (const p of progressions) {
      progressionMap.set(p.semesterId, p);
    }

    const semesters = Array.from(semesterMap.values()).map((sem) => {
      const prog = progressionMap.get(sem.semesterId);
      return {
        ...sem,
        sgpa: prog ? Number(prog.sgpa) : 0.0,
        cgpa: prog ? Number(prog.cgpa) : 0.0,
        creditsAttempted: prog ? prog.creditsAttempted : 0,
        creditsEarned: prog ? prog.creditsEarned : 0,
        academicStanding: prog ? prog.academicStanding : AcademicStanding.GOOD_STANDING,
      };
    });

    const latestProgression = progressions.length > 0 ? progressions[progressions.length - 1] : null;

    return {
      studentInfo: {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        program: student.program.name,
        programCode: student.program.code,
        department: student.program.department.name,
        faculty: student.program.department.faculty.name,
        campus: student.campus.name,
        cohortYear: student.cohortYear,
        status: student.status,
      },
      cumulativeSummary: {
        cgpa: latestProgression ? Number(latestProgression.cgpa) : 0.0,
        totalCreditsAttempted: latestProgression ? latestProgression.creditsAttempted : 0,
        totalCreditsEarned: latestProgression ? latestProgression.creditsEarned : 0,
        currentStanding: latestProgression ? latestProgression.academicStanding : AcademicStanding.GOOD_STANDING,
      },
      semesters,
      isOfficial,
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Shortcut: Get logged in student's grades
   */
  async getMyGrades(user: JwtPayload) {
    if (!user.studentId) {
      throw new ForbiddenException('Authenticated user is not a linked student.');
    }
    return this.getStudentTranscript(user.studentId, false);
  }

  // =========================================================================
  // 7. ROLE QUERY VIEWS FOR MODERATION, APPROVAL, & PUBLICATION PIPELINES
  // =========================================================================

  async getSectionsByWorkflowStatus(status: GradeWorkflowStatus) {
    const sections = await this.db.classSection.findMany({
      where: {
        enrollments: {
          some: {
            semesterGrade: {
              workflowStatus: status,
            },
          },
        },
      },
      include: {
        course: true,
        semester: true,
        campus: true,
        primaryLecturer: {
          include: { user: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return sections.map((s) => ({
      id: s.id,
      sectionName: s.sectionName,
      courseCode: s.course.code,
      courseTitle: s.course.title,
      semesterCode: s.semester.code,
      campusName: s.campus.name,
      lecturerName: s.primaryLecturer
        ? `${s.primaryLecturer.user.firstName} ${s.primaryLecturer.user.lastName}`
        : 'Unassigned',
      enrolledCount: s._count.enrollments,
      workflowStatus: status,
    }));
  }

  // =========================================================================
  // AUTHORIZATION / VALIDATION HELPERS
  // =========================================================================

  private assertLecturerOrAdmin(section: any, user: JwtPayload) {
    const isGlobalAdmin = user.roles.some((r) =>
      [
        SystemRole.SUPER_ADMIN,
        SystemRole.INSTITUTION_ADMIN,
        SystemRole.REGISTRAR,
        SystemRole.ACADEMIC_ADMIN,
        SystemRole.HEAD_OF_DEPARTMENT,
        SystemRole.DEAN,
      ].includes(r as SystemRole),
    );

    if (isGlobalAdmin) return;

    if (user.roles.includes(SystemRole.LECTURER)) {
      if (user.staffId && section.primaryLecturerId === user.staffId) {
        return;
      }
      throw new ForbiddenException(
        'You are not assigned as the primary lecturer for this class section.',
      );
    }

    throw new ForbiddenException('Insufficient permissions to manage grades for this course section.');
  }

  private async assertSectionGradesEditable(sectionId: string) {
    const publishedGrade = await this.db.semesterGrade.findFirst({
      where: {
        enrollment: { classSectionId: sectionId },
        workflowStatus: { in: [GradeWorkflowStatus.SUBMITTED, GradeWorkflowStatus.MODERATED, GradeWorkflowStatus.APPROVED, GradeWorkflowStatus.PUBLISHED] },
      },
    });

    if (publishedGrade) {
      throw new BadRequestException(
        `Marks for section ${sectionId} cannot be modified because grades are in ${publishedGrade.workflowStatus} status.`,
      );
    }
  }
}
