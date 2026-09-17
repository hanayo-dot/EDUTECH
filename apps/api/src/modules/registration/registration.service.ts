import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import {
  RegisterCoursesDto,
  DropCourseDto,
  CreateHoldDto,
  ReleaseHoldDto,
  CreateClassSectionDto,
} from './dto/registration.dto';
import { Decimal } from 'decimal.js';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  // Institutional Credit Limits
  private readonly MIN_CREDIT_HOURS = 3;
  private readonly MAX_CREDIT_HOURS = 21;

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to format day of week number to human string
   */
  private formatDayOfWeek(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day % 7] || `Day ${day}`;
  }

  /**
   * Helper to verify if two time slots overlap on the same day
   */
  private doSlotsOverlap(
    slotA: { dayOfWeek: number; startTime: string; endTime: string },
    slotB: { dayOfWeek: number; startTime: string; endTime: string },
  ): boolean {
    if (slotA.dayOfWeek !== slotB.dayOfWeek) return false;
    // Overlap condition: startA < endB && startB < endA
    return slotA.startTime < slotB.endTime && slotB.startTime < slotA.endTime;
  }

  /**
   * 1. Check Registration Window Status for a Semester
   */
  async getRegistrationWindowStatus(semesterId: string) {
    const semester = await this.db.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: true },
    });

    if (!semester) {
      throw new NotFoundException(`Semester ${semesterId} not found.`);
    }

    const now = new Date();
    const isClosed = semester.isClosed;
    const isBeforeStart = now < semester.registrationStart;
    const isAfterEnd = now > semester.registrationEnd;
    const isOpen = !isClosed && !isBeforeStart && !isAfterEnd;

    let message = 'Registration window is currently open.';
    if (isClosed) {
      message = 'Semester has been formally closed by the Registrar.';
    } else if (isBeforeStart) {
      message = `Registration window has not yet opened. Opens on ${semester.registrationStart.toISOString()}.`;
    } else if (isAfterEnd) {
      message = `Registration deadline has passed. Closed on ${semester.registrationEnd.toISOString()}.`;
    }

    const msRemaining = Math.max(0, semester.registrationEnd.getTime() - now.getTime());
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      semesterId: semester.id,
      semesterCode: semester.code,
      semesterName: semester.name,
      academicYear: semester.academicYear.name,
      registrationStart: semester.registrationStart,
      registrationEnd: semester.registrationEnd,
      isOpen,
      isClosed,
      daysRemaining: isOpen ? daysRemaining : 0,
      message,
    };
  }

  /**
   * 2. List Available Sections for Course Registration with Seat Availability
   */
  async getAvailableSections(params: {
    semesterId: string;
    campusId?: string;
    departmentId?: string;
    search?: string;
  }) {
    const where: any = {
      semesterId: params.semesterId,
    };

    if (params.campusId) where.campusId = params.campusId;
    if (params.departmentId) where.course = { departmentId: params.departmentId };

    if (params.search) {
      where.OR = [
        { sectionName: { contains: params.search, mode: 'insensitive' } },
        { course: { code: { contains: params.search, mode: 'insensitive' } } },
        { course: { title: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const sections = await this.db.classSection.findMany({
      where,
      orderBy: [{ course: { code: 'asc' } }, { sectionName: 'asc' }],
      include: {
        course: {
          include: {
            department: { select: { id: true, code: true, name: true } },
            prerequisites: {
              include: {
                prerequisiteCourse: { select: { id: true, code: true, title: true } },
              },
            },
          },
        },
        campus: { select: { id: true, code: true, name: true } },
        primaryLecturer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        timetableSlots: {
          include: {
            room: { select: { id: true, building: true, roomNumber: true, roomType: true } },
          },
        },
      },
    });

    return sections.map((sec) => {
      const seatsAvailable = Math.max(0, sec.capacity - sec.enrolledCount);
      const isFull = sec.enrolledCount >= sec.capacity;

      return {
        id: sec.id,
        sectionName: sec.sectionName,
        capacity: sec.capacity,
        enrolledCount: sec.enrolledCount,
        seatsAvailable,
        isFull,
        lockVersion: sec.lockVersion,
        course: {
          id: sec.course.id,
          code: sec.course.code,
          title: sec.course.title,
          creditHours: sec.course.creditHours,
          department: sec.course.department.name,
          prerequisites: sec.course.prerequisites.map((p) => ({
            id: p.prerequisiteCourse.id,
            code: p.prerequisiteCourse.code,
            title: p.prerequisiteCourse.title,
            minGrade: p.minGradeRequired,
          })),
        },
        campus: sec.campus,
        lecturer: sec.primaryLecturer
          ? `${sec.primaryLecturer.user.firstName} ${sec.primaryLecturer.user.lastName}`
          : 'To Be Assigned',
        schedule: sec.timetableSlots.map((ts) => ({
          id: ts.id,
          dayOfWeek: ts.dayOfWeek,
          dayName: this.formatDayOfWeek(ts.dayOfWeek),
          startTime: ts.startTime,
          endTime: ts.endTime,
          sessionType: ts.sessionType,
          room: `${ts.room.building} - Rm ${ts.room.roomNumber}`,
        })),
      };
    });
  }

  /**
   * 3. Get Specific Class Section Details
   */
  async getSectionById(id: string) {
    const sec = await this.db.classSection.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: true,
            prerequisites: {
              include: { prerequisiteCourse: true },
            },
          },
        },
        campus: true,
        primaryLecturer: {
          include: { user: true },
        },
        timetableSlots: {
          include: { room: true },
        },
      },
    });

    if (!sec) {
      throw new NotFoundException(`ClassSection ${id} not found.`);
    }

    return {
      ...sec,
      seatsAvailable: Math.max(0, sec.capacity - sec.enrolledCount),
      isFull: sec.enrolledCount >= sec.capacity,
    };
  }

  /**
   * 4. Get Student's Active Enrollments for a Semester
   */
  async getStudentRegistrations(studentId: string, semesterId: string) {
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, admissionNumber: true } },
        program: { select: { id: true, code: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found.`);
    }

    const enrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        semesterId,
        status: 'ENROLLED',
      },
      include: {
        classSection: {
          include: {
            course: true,
            primaryLecturer: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
            timetableSlots: {
              include: { room: true },
            },
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    const totalCredits = enrollments.reduce(
      (sum, e) => sum + e.classSection.course.creditHours,
      0,
    );

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        program: student.program.name,
        currentLevel: student.currentLevel,
      },
      totalCredits,
      enrollmentCount: enrollments.length,
      enrollments: enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        registeredAt: e.registeredAt,
        classSectionId: e.classSectionId,
        sectionName: e.classSection.sectionName,
        course: {
          id: e.classSection.course.id,
          code: e.classSection.course.code,
          title: e.classSection.course.title,
          creditHours: e.classSection.course.creditHours,
        },
        lecturer: e.classSection.primaryLecturer
          ? `${e.classSection.primaryLecturer.user.firstName} ${e.classSection.primaryLecturer.user.lastName}`
          : 'TBA',
        schedule: e.classSection.timetableSlots.map((ts) => ({
          dayOfWeek: ts.dayOfWeek,
          dayName: this.formatDayOfWeek(ts.dayOfWeek),
          startTime: ts.startTime,
          endTime: ts.endTime,
          room: `${ts.room.building} ${ts.room.roomNumber}`,
        })),
      })),
    };
  }

  /**
   * 5. HIGH-CONCURRENCY COURSE REGISTRATION ENGINE
   * Implements strict validation, credit checks, prerequisites, timetable clash detection,
   * financial holds, and pessimistic row locking on section capacity.
   */
  async registerCourses(
    studentId: string,
    dto: RegisterCoursesDto,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const { semesterId, classSectionIds } = dto;

    // A. Verify Registration Window
    const semester = await this.db.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new NotFoundException(`Semester ${semesterId} not found.`);
    }

    const now = new Date();
    if (semester.isClosed || now < semester.registrationStart || now > semester.registrationEnd) {
      throw new BadRequestException({
        code: 'REGISTRATION_WINDOW_CLOSED',
        message: `Course registration is closed for ${semester.name}. Window: ${semester.registrationStart.toISOString()} - ${semester.registrationEnd.toISOString()}`,
      });
    }

    // B. Verify Student Status and Academic/Financial Holds
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      include: {
        financialHolds: { where: { isActive: true } },
        user: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found.`);
    }

    if (student.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'STUDENT_INACTIVE',
        message: `Student account status is ${student.status}. Only ACTIVE students can register for courses.`,
      });
    }

    if (student.financialHolds && student.financialHolds.length > 0) {
      const holdReasons = student.financialHolds.map((h) => h.reason).join('; ');
      throw new ForbiddenException({
        code: 'REGISTRATION_HOLD_BLOCKED',
        message: `Registration blocked due to active financial hold: ${holdReasons}. Please resolve outstanding institutional balances with the Finance Department.`,
      });
    }

    // C. Fetch Requested Class Sections with Course, Prerequisites, and Timetable Slots
    const requestedSections = await this.db.classSection.findMany({
      where: {
        id: { in: classSectionIds },
        semesterId,
      },
      include: {
        course: {
          include: {
            prerequisites: {
              include: { prerequisiteCourse: true },
            },
          },
        },
        timetableSlots: true,
      },
    });

    if (requestedSections.length !== classSectionIds.length) {
      throw new NotFoundException({
        code: 'SECTIONS_NOT_FOUND',
        message: 'One or more requested class sections do not exist or do not belong to the selected semester.',
      });
    }

    // Check duplicate course registration in same batch
    const courseIdSet = new Set<string>();
    for (const sec of requestedSections) {
      if (courseIdSet.has(sec.courseId)) {
        throw new BadRequestException({
          code: 'DUPLICATE_COURSE_SELECTED',
          message: `Cannot register for multiple sections of the same course: ${sec.course.code} (${sec.course.title}).`,
        });
      }
      courseIdSet.add(sec.courseId);
    }

    // D. Fetch Existing Active Enrollments for this Semester
    const existingEnrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        semesterId,
        status: 'ENROLLED',
      },
      include: {
        classSection: {
          include: {
            course: true,
            timetableSlots: true,
          },
        },
      },
    });

    // Check if student is already enrolled in any of the requested courses
    for (const enrolled of existingEnrollments) {
      if (courseIdSet.has(enrolled.classSection.courseId)) {
        throw new ConflictException({
          code: 'ALREADY_ENROLLED',
          message: `Student is already enrolled in course ${enrolled.classSection.course.code}.`,
        });
      }
    }

    // E. Credit Limits Calculation
    const currentCredits = existingEnrollments.reduce(
      (sum, e) => sum + e.classSection.course.creditHours,
      0,
    );
    const requestedCredits = requestedSections.reduce(
      (sum, s) => sum + s.course.creditHours,
      0,
    );
    const totalProjectedCredits = currentCredits + requestedCredits;

    if (totalProjectedCredits > this.MAX_CREDIT_HOURS) {
      throw new BadRequestException({
        code: 'CREDIT_LIMIT_EXCEEDED',
        message: `Registration exceeds maximum allowed semester credits (${this.MAX_CREDIT_HOURS} credits). Current: ${currentCredits}, Requested: ${requestedCredits}, Total: ${totalProjectedCredits}.`,
      });
    }

    // F. Prerequisite Validation
    // Fetch all courses passed by student in previous semesters
    const passedCourses = await this.db.enrollment.findMany({
      where: {
        studentId,
        OR: [
          { status: 'ENROLLED' },
          { status: 'COMPLETED' },
          {
            semesterGrade: {
              letterGrade: { notIn: ['F', 'E', 'INC', 'FAIL'] },
            },
          },
        ],
      },
      include: {
        classSection: { select: { courseId: true } },
      },
    });

    const passedCourseIds = new Set(passedCourses.map((e) => e.classSection.courseId));

    for (const sec of requestedSections) {
      for (const prereq of sec.course.prerequisites) {
        if (!passedCourseIds.has(prereq.prerequisiteCourseId)) {
          throw new BadRequestException({
            code: 'PREREQUISITE_NOT_MET',
            message: `Cannot register for ${sec.course.code} (${sec.course.title}). Missing prerequisite course: ${prereq.prerequisiteCourse.code} (${prereq.prerequisiteCourse.title}).`,
          });
        }
      }
    }

    // G. Timetable Clash Detection
    // Collect all schedule slots for existing enrolled sections + requested sections
    const allSlots: Array<{
      courseCode: string;
      sectionName: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }> = [];

    for (const ee of existingEnrollments) {
      for (const slot of ee.classSection.timetableSlots) {
        allSlots.push({
          courseCode: ee.classSection.course.code,
          sectionName: ee.classSection.sectionName,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }

    for (const sec of requestedSections) {
      for (const slot of sec.timetableSlots) {
        for (const existingSlot of allSlots) {
          if (this.doSlotsOverlap(slot, existingSlot)) {
            const dayName = this.formatDayOfWeek(slot.dayOfWeek);
            throw new ConflictException({
              code: 'TIMETABLE_CLASH',
              message: `Timetable conflict detected on ${dayName} between ${existingSlot.courseCode} (${existingSlot.startTime}-${existingSlot.endTime}) and ${sec.course.code} (${slot.startTime}-${slot.endTime}).`,
            });
          }
        }
        allSlots.push({
          courseCode: sec.course.code,
          sectionName: sec.sectionName,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }

    // H. ATOMIC DATABASE TRANSACTION WITH PESSIMISTIC ROW LOCKS (FOR UPDATE)
    const registrationResult = await this.db.$transaction(async (tx) => {
      const enrolledSections = [];

      for (const sectionId of classSectionIds) {
        // Pessimistic Row-Level Lock: SELECT ... FOR UPDATE
        // Guarantees no two concurrent transactions can over-enroll section seats
        const lockedRows = await tx.$queryRaw<
          Array<{
            id: string;
            capacity: number;
            enrolledCount: number;
            lockVersion: number;
            sectionName: string;
          }>
        >`SELECT id, capacity, "enrolledCount", "lockVersion", "sectionName"
          FROM class_sections
          WHERE id = ${sectionId}
          FOR UPDATE`;

        const lockedSection = lockedRows[0];

        if (!lockedSection) {
          throw new NotFoundException(`Section ${sectionId} not found.`);
        }

        if (lockedSection.enrolledCount >= lockedSection.capacity) {
          throw new ConflictException({
            code: 'SECTION_CAPACITY_FULL',
            message: `Class section ${lockedSection.sectionName} is full (${lockedSection.enrolledCount}/${lockedSection.capacity} seats). No seats remaining.`,
          });
        }

        // Increment enrolledCount and bump lockVersion
        await tx.$executeRaw`
          UPDATE class_sections
          SET "enrolledCount" = "enrolledCount" + 1,
              "lockVersion" = "lockVersion" + 1,
              "updatedAt" = NOW()
          WHERE id = ${sectionId}
        `;

        // Upsert Enrollment record
        const enrollment = await tx.enrollment.upsert({
          where: {
            studentId_classSectionId: {
              studentId,
              classSectionId: sectionId,
            },
          },
          update: {
            status: 'ENROLLED',
            droppedAt: null,
            registeredAt: new Date(),
          },
          create: {
            studentId,
            classSectionId: sectionId,
            semesterId,
            status: 'ENROLLED',
          },
        });

        enrolledSections.push({
          enrollmentId: enrollment.id,
          classSectionId: sectionId,
          sectionName: lockedSection.sectionName,
          remainingSeats: lockedSection.capacity - (lockedSection.enrolledCount + 1),
        });
      }

      return enrolledSections;
    });

    // I. Tamper-Evident Audit Logging
    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'COURSES_REGISTERED',
      resource: 'ENROLLMENT',
      resourceId: studentId,
      newValues: {
        semesterId,
        enrolledCount: registrationResult.length,
        totalSemesterCredits: totalProjectedCredits,
        sectionIds: classSectionIds,
      },
      ipAddress,
      userAgent,
      reason: `Registered for ${registrationResult.length} course sections`,
    });

    return {
      success: true,
      studentId,
      semesterId,
      registeredSections: registrationResult,
      totalCreditsEnrolled: totalProjectedCredits,
      message: `Successfully registered for ${registrationResult.length} course(s). Total semester credits: ${totalProjectedCredits}.`,
    };
  }

  /**
   * 6. DROP COURSE
   * Atomically decrements class section capacity and updates enrollment status to DROPPED.
   */
  async dropCourse(
    studentId: string,
    dto: DropCourseDto,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const { classSectionId, reason } = dto;

    const enrollment = await this.db.enrollment.findUnique({
      where: {
        studentId_classSectionId: { studentId, classSectionId },
      },
      include: {
        semester: true,
        classSection: { include: { course: true } },
      },
    });

    if (!enrollment || enrollment.status !== 'ENROLLED') {
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'No active enrollment found for this course section.',
      });
    }

    // Verify registration/drop window
    const now = new Date();
    if (enrollment.semester.isClosed || now > enrollment.semester.registrationEnd) {
      throw new BadRequestException({
        code: 'DROP_WINDOW_CLOSED',
        message: 'Add/Drop deadline for this semester has passed. You cannot drop courses at this time.',
      });
    }

    // Execute atomic drop transaction with row lock
    await this.db.$transaction(async (tx) => {
      // 1. Lock class section row
      await tx.$executeRaw`
        UPDATE class_sections
        SET "enrolledCount" = GREATEST(0, "enrolledCount" - 1),
            "lockVersion" = "lockVersion" + 1,
            "updatedAt" = NOW()
        WHERE id = ${classSectionId}
      `;

      // 2. Mark enrollment as DROPPED
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'DROPPED',
          droppedAt: new Date(),
        },
      });
    });

    // Audit log
    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'COURSE_DROPPED',
      resource: 'ENROLLMENT',
      resourceId: enrollment.id,
      newValues: {
        courseCode: enrollment.classSection.course.code,
        classSectionId,
        reason: reason || 'Student initiated drop',
      },
      ipAddress,
      userAgent,
      reason: reason || 'Course dropped within open window',
    });

    return {
      success: true,
      droppedCourse: enrollment.classSection.course.code,
      sectionName: enrollment.classSection.sectionName,
      status: 'DROPPED',
      message: `Successfully dropped ${enrollment.classSection.course.code}. Class seat capacity has been restored.`,
    };
  }

  /**
   * 7. Create Financial/Academic Hold
   */
  async placeHold(
    dto: CreateHoldDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const student = await this.db.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student ${dto.studentId} not found.`);
    }

    const hold = await this.db.financialHold.create({
      data: {
        studentId: dto.studentId,
        reason: dto.reason,
        thresholdAmount: new Decimal(dto.thresholdAmount || 0),
        isActive: true,
      },
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'HOLD_PLACED',
      resource: 'FINANCIAL_HOLD',
      resourceId: hold.id,
      newValues: {
        studentId: dto.studentId,
        reason: dto.reason,
        thresholdAmount: dto.thresholdAmount,
      },
      ipAddress,
      userAgent,
      reason: dto.reason,
    });

    return hold;
  }

  /**
   * 8. Release Financial/Academic Hold
   */
  async releaseHold(
    holdId: string,
    dto: ReleaseHoldDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const hold = await this.db.financialHold.findUnique({
      where: { id: holdId },
    });

    if (!hold) {
      throw new NotFoundException(`Hold ${holdId} not found.`);
    }

    const updated = await this.db.financialHold.update({
      where: { id: holdId },
      data: {
        isActive: false,
        releasedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'HOLD_RELEASED',
      resource: 'FINANCIAL_HOLD',
      resourceId: holdId,
      newValues: {
        isActive: false,
        releasedAt: updated.releasedAt,
        reason: dto.reason || 'Hold resolved',
      },
      ipAddress,
      userAgent,
      reason: dto.reason || 'Hold cleared by officer',
    });

    return updated;
  }

  /**
   * 9. Get Student Holds
   */
  async getStudentHolds(studentId: string) {
    const holds = await this.db.financialHold.findMany({
      where: { studentId },
      orderBy: { placedAt: 'desc' },
    });

    const activeHolds = holds.filter((h) => h.isActive);

    return {
      studentId,
      hasActiveHolds: activeHolds.length > 0,
      activeHoldsCount: activeHolds.length,
      holds: holds.map((h) => ({
        id: h.id,
        reason: h.reason,
        thresholdAmount: Number(h.thresholdAmount),
        isActive: h.isActive,
        placedAt: h.placedAt,
        releasedAt: h.releasedAt,
      })),
    };
  }

  /**
   * 10. Create Class Section
   */
  async createClassSection(
    dto: CreateClassSectionDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const existing = await this.db.classSection.findUnique({
      where: {
        courseId_semesterId_campusId_sectionName: {
          courseId: dto.courseId,
          semesterId: dto.semesterId,
          campusId: dto.campusId,
          sectionName: dto.sectionName,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'SECTION_ALREADY_EXISTS',
        message: `A section with name "${dto.sectionName}" already exists for this course, semester, and campus.`,
      });
    }

    const section = await this.db.classSection.create({
      data: {
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        campusId: dto.campusId,
        sectionName: dto.sectionName,
        capacity: dto.capacity,
        primaryLecturerId: dto.primaryLecturerId || null,
      },
      include: {
        course: true,
        campus: true,
      },
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'CLASS_SECTION_CREATED',
      resource: 'CLASS_SECTION',
      resourceId: section.id,
      newValues: {
        sectionName: section.sectionName,
        capacity: section.capacity,
        courseCode: section.course.code,
      },
      ipAddress,
      userAgent,
      reason: 'New class section created',
    });

    return section;
  }
}
