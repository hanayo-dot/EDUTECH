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
  CreateAttendanceSessionDto,
  BatchMarkAttendanceDto,
  StudentCheckInDto,
} from './dto/attendance.dto';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly MIN_ATTENDANCE_THRESHOLD = 75; // Institutional 75% Exam Eligibility Rule

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper: Generate QR Code data URL containing cryptographic token payload
   */
  private async generateQrDataUrl(payload: {
    sessionId: string;
    qrToken: string;
    expiresAt: Date;
  }): Promise<string> {
    const rawPayload = JSON.stringify({
      sId: payload.sessionId,
      tok: payload.qrToken,
      exp: payload.expiresAt.toISOString(),
    });
    return QRCode.toDataURL(rawPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
    });
  }

  // =========================================================================
  // 1. ATTENDANCE SESSION MANAGEMENT
  // =========================================================================

  /**
   * Create an Attendance Session with Dynamic, Time-Decaying QR Code
   */
  async createSession(
    dto: CreateAttendanceSessionDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const section = await this.db.classSection.findUnique({
      where: { id: dto.classSectionId },
      include: {
        course: true,
        primaryLecturer: { include: { user: true } },
      },
    });

    if (!section) {
      throw new NotFoundException(`ClassSection ${dto.classSectionId} not found.`);
    }

    const sessionDate = new Date(dto.sessionDate);
    if (isNaN(sessionDate.getTime())) {
      throw new BadRequestException('Invalid sessionDate format. Use YYYY-MM-DD.');
    }

    const qrExpiryMinutes = dto.qrExpiryMinutes || 15;
    const qrToken = randomUUID();
    const qrExpiresAt = new Date(Date.now() + qrExpiryMinutes * 60 * 1000);

    const session = await this.db.attendanceSession.create({
      data: {
        classSectionId: dto.classSectionId,
        lecturerId: section.primaryLecturerId || officer.sub,
        sessionDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        qrToken,
        qrExpiresAt,
      },
      include: {
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    // Generate Dynamic QR Code Data URL
    const qrCodeDataUrl = await this.generateQrDataUrl({
      sessionId: session.id,
      qrToken,
      expiresAt: qrExpiresAt,
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'ATTENDANCE_SESSION_INITIATED',
      resource: 'ATTENDANCE_SESSION',
      resourceId: session.id,
      newValues: {
        courseCode: section.course.code,
        sectionName: section.sectionName,
        date: session.sessionDate.toISOString().split('T')[0],
        time: `${session.startTime}-${session.endTime}`,
        qrExpiresAt: qrExpiresAt.toISOString(),
      },
      ipAddress,
      userAgent,
      reason: 'Lecturer initiated instructional attendance session',
    });

    return {
      ...session,
      qrCodeDataUrl,
      validityDurationMinutes: qrExpiryMinutes,
    };
  }

  /**
   * Rotate / Refresh Dynamic QR Token for Active Session
   */
  async refreshQrToken(
    sessionId: string,
    qrExpiryMinutes = 15,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const session = await this.db.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { classSection: { include: { course: true } } },
    });

    if (!session) {
      throw new NotFoundException(`AttendanceSession ${sessionId} not found.`);
    }

    const newQrToken = randomUUID();
    const newQrExpiresAt = new Date(Date.now() + qrExpiryMinutes * 60 * 1000);

    const updated = await this.db.attendanceSession.update({
      where: { id: sessionId },
      data: {
        qrToken: newQrToken,
        qrExpiresAt: newQrExpiresAt,
      },
      include: {
        classSection: {
          include: { course: true },
        },
      },
    });

    const qrCodeDataUrl = await this.generateQrDataUrl({
      sessionId,
      qrToken: newQrToken,
      expiresAt: newQrExpiresAt,
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'ATTENDANCE_QR_ROTATED',
      resource: 'ATTENDANCE_SESSION',
      resourceId: sessionId,
      newValues: {
        newQrExpiresAt: newQrExpiresAt.toISOString(),
      },
      ipAddress,
      userAgent,
      reason: 'Dynamic QR token refreshed for anti-fraud projection',
    });

    return {
      ...updated,
      qrCodeDataUrl,
      validityDurationMinutes: qrExpiryMinutes,
    };
  }

  /**
   * Get Full Session Details with Student Roster & Live Statistics
   */
  async getSessionDetails(sessionId: string) {
    const session = await this.db.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
        records: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`AttendanceSession ${sessionId} not found.`);
    }

    // Fetch all actively enrolled students in this section
    const enrollments = await this.db.enrollment.findMany({
      where: {
        classSectionId: session.classSectionId,
        status: 'ENROLLED',
      },
      include: {
        student: {
          include: { user: true },
        },
      },
      orderBy: { student: { admissionNumber: 'asc' } },
    });

    const recordsMap = new Map(session.records.map((r) => [r.studentId, r]));

    const roster = enrollments.map((en) => {
      const rec = recordsMap.get(en.studentId);
      return {
        studentId: en.student.id,
        admissionNumber: en.student.admissionNumber,
        name: `${en.student.user.firstName} ${en.student.user.lastName}`,
        email: en.student.user.email,
        status: rec ? rec.status : 'ABSENT',
        verificationMethod: rec ? rec.verificationMethod : 'MANUAL',
        markedAt: rec ? rec.markedAt : null,
      };
    });

    const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
    const lateCount = roster.filter((r) => r.status === 'LATE').length;
    const excusedCount = roster.filter((r) => r.status === 'EXCUSED').length;
    const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
    const totalEnrolled = roster.length;

    const attendanceRate =
      totalEnrolled > 0
        ? Math.round(((presentCount + lateCount * 0.5 + excusedCount) / totalEnrolled) * 100)
        : 0;

    const isQrActive = session.qrExpiresAt ? new Date() < session.qrExpiresAt : false;
    let qrCodeDataUrl: string | null = null;
    if (isQrActive && session.qrToken) {
      qrCodeDataUrl = await this.generateQrDataUrl({
        sessionId: session.id,
        qrToken: session.qrToken,
        expiresAt: session.qrExpiresAt!,
      });
    }

    return {
      session: {
        id: session.id,
        classSectionId: session.classSectionId,
        courseCode: session.classSection.course.code,
        courseTitle: session.classSection.course.title,
        sectionName: session.classSection.sectionName,
        sessionDate: session.sessionDate.toISOString().split('T')[0],
        startTime: session.startTime,
        endTime: session.endTime,
        qrExpiresAt: session.qrExpiresAt,
        isQrActive,
        qrCodeDataUrl,
      },
      statistics: {
        totalEnrolled,
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        attendanceRate,
      },
      roster,
    };
  }

  /**
   * List all attendance sessions for a class section
   */
  async getSectionSessions(classSectionId: string) {
    const section = await this.db.classSection.findUnique({
      where: { id: classSectionId },
      include: { course: true },
    });

    if (!section) {
      throw new NotFoundException(`ClassSection ${classSectionId} not found.`);
    }

    const sessions = await this.db.attendanceSession.findMany({
      where: { classSectionId },
      orderBy: [{ sessionDate: 'desc' }, { startTime: 'desc' }],
      include: {
        _count: { select: { records: true } },
      },
    });

    const totalEnrolled = await this.db.enrollment.count({
      where: { classSectionId, status: 'ENROLLED' },
    });

    return {
      section: {
        id: section.id,
        courseCode: section.course.code,
        courseTitle: section.course.title,
        sectionName: section.sectionName,
        totalEnrolled,
      },
      totalSessions: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionDate: s.sessionDate.toISOString().split('T')[0],
        startTime: s.startTime,
        endTime: s.endTime,
        recordsCount: s._count.records,
        isQrActive: s.qrExpiresAt ? new Date() < s.qrExpiresAt : false,
      })),
    };
  }

  // =========================================================================
  // 2. MULTI-METHOD ATTENDANCE RECORDING
  // =========================================================================

  /**
   * Method A: Manual Roster Marking by Lecturer
   */
  async batchMarkAttendance(
    sessionId: string,
    dto: BatchMarkAttendanceDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const session = await this.db.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        classSection: { include: { course: true } },
      },
    });

    if (!session) {
      throw new NotFoundException(`AttendanceSession ${sessionId} not found.`);
    }

    // Verify student IDs are valid and active in section
    const enrollments = await this.db.enrollment.findMany({
      where: {
        classSectionId: session.classSectionId,
        status: 'ENROLLED',
      },
      select: { studentId: true },
    });
    const enrolledSet = new Set(enrollments.map((e) => e.studentId));

    const recordsToProcess = dto.records.filter((r) => enrolledSet.has(r.studentId));

    // Upsert attendance records atomically in transaction
    await this.db.$transaction(async (tx) => {
      for (const rec of recordsToProcess) {
        await tx.attendanceRecord.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: sessionId,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status,
            verificationMethod: 'MANUAL',
            markedAt: new Date(),
          },
          create: {
            attendanceSessionId: sessionId,
            studentId: rec.studentId,
            status: rec.status,
            verificationMethod: 'MANUAL',
            markedAt: new Date(),
          },
        });
      }
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'ATTENDANCE_BATCH_MARKED',
      resource: 'ATTENDANCE_RECORD',
      resourceId: sessionId,
      newValues: {
        sessionDate: session.sessionDate.toISOString().split('T')[0],
        courseCode: session.classSection.course.code,
        markedCount: recordsToProcess.length,
      },
      ipAddress,
      userAgent,
      reason: 'Lecturer recorded batch attendance roster',
    });

    return {
      success: true,
      sessionId,
      recordsMarked: recordsToProcess.length,
      message: `Successfully recorded attendance for ${recordsToProcess.length} students.`,
    };
  }

  /**
   * Method B: Student Self-Service QR Code Check-In
   */
  async studentCheckIn(
    dto: StudentCheckInDto,
    studentUser: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const { qrToken } = dto;

    // 1. Resolve Session by QR Token
    const session = await this.db.attendanceSession.findUnique({
      where: { qrToken },
      include: {
        classSection: {
          include: { course: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'INVALID_QR_TOKEN',
        message: 'Invalid or unrecognized attendance QR code token.',
      });
    }

    // 2. Verify QR Token Expiry
    const now = new Date();
    if (!session.qrExpiresAt || now > session.qrExpiresAt) {
      throw new BadRequestException({
        code: 'QR_TOKEN_EXPIRED',
        message: 'The attendance QR code has expired. Please ask the lecturer to refresh the QR code on the lecture display.',
      });
    }

    // 3. Resolve Student Profile
    const student = await this.db.student.findUnique({
      where: { userId: studentUser.sub },
      include: { user: true },
    });

    if (!student) {
      throw new BadRequestException('Authenticated user has no student profile.');
    }

    // 4. Verify Active Enrollment in this Class Section
    const enrollment = await this.db.enrollment.findUnique({
      where: {
        studentId_classSectionId: {
          studentId: student.id,
          classSectionId: session.classSectionId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ENROLLED') {
      throw new ForbiddenException({
        code: 'STUDENT_NOT_ENROLLED',
        message: `You are not actively enrolled in ${session.classSection.course.code} (${session.classSection.sectionName}) and cannot check in for this session.`,
      });
    }

    // 5. Check if already checked in
    const existing = await this.db.attendanceRecord.findUnique({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId: session.id,
          studentId: student.id,
        },
      },
    });

    if (existing && existing.status === 'PRESENT') {
      throw new ConflictException({
        code: 'ALREADY_CHECKED_IN',
        message: `You have already checked in for this session at ${existing.markedAt.toISOString()}.`,
      });
    }

    // 6. Record Verification
    const record = await this.db.attendanceRecord.upsert({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId: session.id,
          studentId: student.id,
        },
      },
      update: {
        status: 'PRESENT',
        verificationMethod: 'QR_CODE',
        markedAt: now,
      },
      create: {
        attendanceSessionId: session.id,
        studentId: student.id,
        status: 'PRESENT',
        verificationMethod: 'QR_CODE',
        markedAt: now,
      },
    });

    await this.auditService.log({
      userId: studentUser.sub,
      userEmail: studentUser.email,
      action: 'ATTENDANCE_QR_CHECKIN',
      resource: 'ATTENDANCE_RECORD',
      resourceId: record.id,
      newValues: {
        courseCode: session.classSection.course.code,
        sectionName: session.classSection.sectionName,
        verificationMethod: 'QR_CODE',
        checkInTime: now.toISOString(),
      },
      ipAddress,
      userAgent,
      reason: 'Student checked in via dynamic lecture hall QR code',
    });

    return {
      success: true,
      status: 'PRESENT',
      courseCode: session.classSection.course.code,
      courseTitle: session.classSection.course.title,
      sectionName: session.classSection.sectionName,
      sessionDate: session.sessionDate.toISOString().split('T')[0],
      checkInTime: now.toISOString(),
      verificationMethod: 'QR_CODE',
      message: `Check-in successful! Attendance verified for ${session.classSection.course.code}.`,
    };
  }

  // =========================================================================
  // 3. ATTENDANCE ANALYTICS & INSTITUTIONAL EXAM ELIGIBILITY (75% RULE)
  // =========================================================================

  /**
   * Student Summary: Calculates percentage per enrolled course with 75% exam threshold rule
   */
  async getStudentAttendanceSummary(studentId: string, semesterId?: string) {
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, admissionNumber: true, email: true } },
        program: { select: { id: true, code: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found.`);
    }

    // Active enrollments
    const enrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        status: 'ENROLLED',
        semesterId: semesterId || undefined,
      },
      include: {
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    const coursesBreakdown = [];
    let totalSessionsAllCourses = 0;
    let totalAttendedAllCourses = 0;

    for (const en of enrollments) {
      // Find all conducted sessions for this section
      const sessions = await this.db.attendanceSession.findMany({
        where: { classSectionId: en.classSectionId },
        select: { id: true, sessionDate: true },
        orderBy: { sessionDate: 'asc' },
      });

      const sessionIds = sessions.map((s) => s.id);
      const totalSessions = sessionIds.length;

      // Find student records for these sessions
      const records = await this.db.attendanceRecord.findMany({
        where: {
          attendanceSessionId: { in: sessionIds },
          studentId,
        },
      });

      const recordsMap = new Map(records.map((r) => [r.attendanceSessionId, r.status]));

      let presentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;
      let absentCount = 0;

      for (const sId of sessionIds) {
        const st = recordsMap.get(sId);
        if (st === 'PRESENT') presentCount++;
        else if (st === 'LATE') lateCount++;
        else if (st === 'EXCUSED') excusedCount++;
        else absentCount++;
      }

      // Institutional Attendance Calculation Formula:
      // Rate = ((Present + (Late * 0.5) + Excused) / TotalSessions) * 100
      const effectiveAttended = presentCount + lateCount * 0.5 + excusedCount;
      const attendanceRate =
        totalSessions > 0 ? Math.round((effectiveAttended / totalSessions) * 100) : 100;

      const isEligibleForExam = attendanceRate >= this.MIN_ATTENDANCE_THRESHOLD;
      let warningLevel = 'GOOD';
      if (attendanceRate < 60) warningLevel = 'CRITICAL';
      else if (attendanceRate < this.MIN_ATTENDANCE_THRESHOLD) warningLevel = 'WARNING';

      totalSessionsAllCourses += totalSessions;
      totalAttendedAllCourses += effectiveAttended;

      coursesBreakdown.push({
        classSectionId: en.classSectionId,
        courseCode: en.classSection.course.code,
        courseTitle: en.classSection.course.title,
        sectionName: en.classSection.sectionName,
        lecturer: en.classSection.primaryLecturer
          ? `${en.classSection.primaryLecturer.user.firstName} ${en.classSection.primaryLecturer.user.lastName}`
          : 'TBA',
        totalSessions,
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        attendanceRate,
        isEligibleForExam,
        warningLevel,
        thresholdRequired: this.MIN_ATTENDANCE_THRESHOLD,
      });
    }

    const cumulativeRate =
      totalSessionsAllCourses > 0
        ? Math.round((totalAttendedAllCourses / totalSessionsAllCourses) * 100)
        : 100;

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber,
        program: student.program.name,
      },
      cumulativeAttendanceRate: cumulativeRate,
      overallEligibleForExams: coursesBreakdown.every((c) => c.isEligibleForExam),
      institutionalRule: `${this.MIN_ATTENDANCE_THRESHOLD}% Minimum Attendance Required for Examination Eligibility`,
      courses: coursesBreakdown,
    };
  }

  /**
   * Section-Level Attendance Audit Report for Faculty & Dean Review
   */
  async getSectionAttendanceReport(classSectionId: string) {
    const section = await this.db.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        course: true,
        primaryLecturer: { include: { user: true } },
      },
    });

    if (!section) {
      throw new NotFoundException(`ClassSection ${classSectionId} not found.`);
    }

    const sessions = await this.db.attendanceSession.findMany({
      where: { classSectionId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);
    const totalSessions = sessionIds.length;

    const enrollments = await this.db.enrollment.findMany({
      where: { classSectionId, status: 'ENROLLED' },
      include: {
        student: { include: { user: true } },
      },
    });

    const records = await this.db.attendanceRecord.findMany({
      where: {
        attendanceSessionId: { in: sessionIds },
      },
    });

    // Group records by student
    const studentRecordsMap = new Map<string, Array<{ status: string }>>();
    for (const r of records) {
      if (!studentRecordsMap.has(r.studentId)) {
        studentRecordsMap.set(r.studentId, []);
      }
      studentRecordsMap.get(r.studentId)!.push(r);
    }

    let totalClassAttended = 0;
    const studentsReport = enrollments.map((en) => {
      const studentRecords = studentRecordsMap.get(en.studentId) || [];
      const presentCount = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const lateCount = studentRecords.filter((r) => r.status === 'LATE').length;
      const excusedCount = studentRecords.filter((r) => r.status === 'EXCUSED').length;
      const absentCount = Math.max(0, totalSessions - (presentCount + lateCount + excusedCount));

      const effectivePresent = presentCount + lateCount * 0.5 + excusedCount;
      const rate =
        totalSessions > 0 ? Math.round((effectivePresent / totalSessions) * 100) : 100;

      totalClassAttended += effectivePresent;

      return {
        studentId: en.student.id,
        admissionNumber: en.student.admissionNumber,
        name: `${en.student.user.firstName} ${en.student.user.lastName}`,
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        attendanceRate: rate,
        isEligibleForExam: rate >= this.MIN_ATTENDANCE_THRESHOLD,
      };
    });

    const atRiskCount = studentsReport.filter((s) => !s.isEligibleForExam).length;
    const classAverageRate =
      totalSessions > 0 && enrollments.length > 0
        ? Math.round((totalClassAttended / (totalSessions * enrollments.length)) * 100)
        : 100;

    return {
      section: {
        id: section.id,
        courseCode: section.course.code,
        courseTitle: section.course.title,
        sectionName: section.sectionName,
        lecturer: section.primaryLecturer
          ? `${section.primaryLecturer.user.firstName} ${section.primaryLecturer.user.lastName}`
          : 'TBA',
      },
      totalSessionsConducted: totalSessions,
      totalEnrolled: enrollments.length,
      classAverageRate,
      atRiskCount,
      students: studentsReport,
    };
  }
}
