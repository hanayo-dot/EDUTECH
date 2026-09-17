import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform.interceptor';
import { DatabaseService } from '../src/modules/database/database.service';

describe('Phase 9: Timetabling & Attendance Engine E2E Suite', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Tokens
  let adminToken: string;
  let registrarToken: string;
  let lecturerToken: string;
  let aliceToken: string;
  let bobToken: string;

  // Base IDs
  let mainCampusId: string;
  let csDeptId: string;
  let activeSemesterId: string;
  let lecturerStaffId: string;
  let aliceStudentId: string;
  let bobStudentId: string;

  // Created Test Entities for Cleanup
  const createdRoomIds: string[] = [];
  const createdCourseIds: string[] = [];
  const createdSectionIds: string[] = [];
  const createdSlotIds: string[] = [];
  const createdSessionIds: string[] = [];

  let testRoomLargeId: string;
  let testRoomSmallId: string;
  let testRoomClashId: string;

  let testCourseId: string;
  let testSection1Id: string;
  let testSection2Id: string;

  let scheduledSlotId: string;
  let activeAttendanceSessionId: string;
  let activeQrToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new TransformResponseInterceptor());

    await app.init();
    db = app.get(DatabaseService);

    // 1. Authenticate Core Actors
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@chuoms.edu', password: 'Password@2026!' });
    adminToken = adminRes.body.data.accessToken;

    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'registrar@chuoms.edu', password: 'Password@2026!' });
    registrarToken = regRes.body.data.accessToken;

    const lecRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'dr.grace@chuoms.edu', password: 'Password@2026!' });
    lecturerToken = lecRes.body.data.accessToken;

    const aliceRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'alice.johnson@student.chuoms.edu', password: 'Password@2026!' });
    aliceToken = aliceRes.body.data.accessToken;

    const bobRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'bob.miller@student.chuoms.edu', password: 'Password@2026!' });
    bobToken = bobRes.body.data.accessToken;

    // 2. Fetch Reference Entities
    const campus = await db.campus.findFirst({ where: { code: 'MAIN' } });
    mainCampusId = campus!.id;

    const dept = await db.department.findFirst({ where: { code: 'CS' } });
    csDeptId = dept!.id;

    const sem = await db.semester.findFirst({ where: { code: '2026-SEM1' } });
    activeSemesterId = sem!.id;

    const staff = await db.staff.findFirst({
      where: { staffNumber: 'STF-SE-001' }, // Dr. Grace Hopper
    });
    lecturerStaffId = staff!.id;

    const aliceStudent = await db.student.findFirst({
      where: { admissionNumber: 'ADM-2026-0001' },
    });
    aliceStudentId = aliceStudent!.id;

    const bobStudent = await db.student.findFirst({
      where: { admissionNumber: 'ADM-2026-0002' },
    });
    bobStudentId = bobStudent!.id;

    // 3. Create Dedicated Rooms for Testing
    const rLarge = await db.room.create({
      data: {
        campusId: mainCampusId,
        building: 'Ada Lovelace Hall',
        roomNumber: `LH-${Date.now() % 10000}`,
        capacity: 60,
        roomType: 'LECTURE_HALL',
      },
    });
    testRoomLargeId = rLarge.id;
    createdRoomIds.push(rLarge.id);

    const rSmall = await db.room.create({
      data: {
        campusId: mainCampusId,
        building: 'Ada Lovelace Hall',
        roomNumber: `SR-${Date.now() % 10000}`,
        capacity: 15,
        roomType: 'SEMINAR_ROOM',
      },
    });
    testRoomSmallId = rSmall.id;
    createdRoomIds.push(rSmall.id);

    const rClash = await db.room.create({
      data: {
        campusId: mainCampusId,
        building: 'Babbage Wing',
        roomNumber: `BW-${Date.now() % 10000}`,
        capacity: 50,
        roomType: 'LAB',
      },
    });
    testRoomClashId = rClash.id;
    createdRoomIds.push(rClash.id);

    // 4. Create Dedicated Course & Sections
    const course = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TT-CS-${Date.now() % 10000}`,
        title: 'Timetabling Algorithms & Scheduling',
        creditHours: 3,
        contactHours: 3,
        level: 300,
      },
    });
    testCourseId = course.id;
    createdCourseIds.push(course.id);

    // Section 1: Capacity 30, Lecturer: Dr. Grace Hopper
    const sec1 = await db.classSection.create({
      data: {
        courseId: testCourseId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        primaryLecturerId: lecturerStaffId,
        sectionName: 'Sec-Timetable-A',
        capacity: 30,
        enrolledCount: 1,
      },
    });
    testSection1Id = sec1.id;
    createdSectionIds.push(sec1.id);

    // Section 2: Capacity 30, Lecturer: Dr. Grace Hopper
    const sec2 = await db.classSection.create({
      data: {
        courseId: testCourseId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        primaryLecturerId: lecturerStaffId,
        sectionName: 'Sec-Timetable-B',
        capacity: 30,
        enrolledCount: 0,
      },
    });
    testSection2Id = sec2.id;
    createdSectionIds.push(sec2.id);

    // Enroll Alice in Section 1 (Alice is actively enrolled, Bob is not)
    await db.enrollment.upsert({
      where: {
        studentId_classSectionId: {
          studentId: aliceStudentId,
          classSectionId: testSection1Id,
        },
      },
      update: { status: 'ENROLLED' },
      create: {
        studentId: aliceStudentId,
        classSectionId: testSection1Id,
        semesterId: activeSemesterId,
        status: 'ENROLLED',
      },
    });
  });

  afterAll(async () => {
    try {
      // 1. Delete attendance records
      await db.attendanceRecord.deleteMany({
        where: {
          session: {
            OR: [
              { id: { in: createdSessionIds } },
              { classSectionId: { in: createdSectionIds } },
            ],
          },
        },
      });

      // 2. Delete attendance sessions
      await db.attendanceSession.deleteMany({
        where: {
          OR: [
            { id: { in: createdSessionIds } },
            { classSectionId: { in: createdSectionIds } },
          ],
        },
      });

      // 3. Delete timetable slots
      await db.timetableSlot.deleteMany({
        where: {
          OR: [
            { id: { in: createdSlotIds } },
            { classSectionId: { in: createdSectionIds } },
            { roomId: { in: createdRoomIds } },
          ],
        },
      });

      // 4. Delete enrollments
      await db.enrollment.deleteMany({
        where: { classSectionId: { in: createdSectionIds } },
      });

      // 5. Delete class sections
      await db.classSection.deleteMany({
        where: { id: { in: createdSectionIds } },
      });

      // 6. Delete courses
      await db.course.deleteMany({
        where: { id: { in: createdCourseIds } },
      });

      // 7. Delete rooms
      await db.room.deleteMany({
        where: { id: { in: createdRoomIds } },
      });
    } catch (e) {
      // Cleanup safe ignore
    }

    await app.close();
  });

  // =========================================================================
  // 1. ROOM RESOURCE MANAGEMENT
  // =========================================================================
  describe('1. Room Resource Management', () => {
    let createdRoomId: string;
    const testRoomNumber = `RM-${Date.now() % 10000}`;

    it('should register a new physical room with capacity and facility type', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/rooms')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          campusId: mainCampusId,
          building: 'Shannon Labs',
          roomNumber: testRoomNumber,
          capacity: 45,
          roomType: 'LAB',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.capacity).toBe(45);
      createdRoomId = res.body.data.id;
      createdRoomIds.push(createdRoomId);
    });

    it('should reject duplicate room creation with same campus, building, and roomNumber', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/rooms')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          campusId: mainCampusId,
          building: 'Shannon Labs',
          roomNumber: testRoomNumber,
          capacity: 50,
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROOM_ALREADY_EXISTS');
    });

    it('should list rooms filtered by campus and search query', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/timetable/rooms?campusId=${mainCampusId}&search=Shannon`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should update room capacity and operational status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/timetable/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          capacity: 55,
          isActive: true,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.capacity).toBe(55);
    });
  });

  // =========================================================================
  // 2. CONFLICT-FREE TIMETABLE SCHEDULING & CLASH DETECTION ENGINE
  // =========================================================================
  describe('2. Timetable Conflict Detection & Clash Engine', () => {
    it('should reject slot allocation when room capacity is less than section capacity', async () => {
      // testSection1 capacity is 30, testRoomSmall capacity is 15
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          classSectionId: testSection1Id,
          roomId: testRoomSmallId,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '11:00',
          sessionType: 'LECTURE',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_ROOM_CAPACITY');
      expect(res.body.error.message).toContain('insufficient for section');
    });

    it('should reject invalid time interval (startTime >= endTime)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          classSectionId: testSection1Id,
          roomId: testRoomLargeId,
          dayOfWeek: 1,
          startTime: '11:00',
          endTime: '09:00', // invalid
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TIME_RANGE');
    });

    it('should reject sessions shorter than 30 minutes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          classSectionId: testSection1Id,
          roomId: testRoomLargeId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '09:15', // 15 mins
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SESSION_TOO_SHORT');
    });

    it('should schedule slot successfully when no conflicts exist', async () => {
      // Section 1 scheduled on Friday 09:00-11:00 in testRoomLarge
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          classSectionId: testSection1Id,
          roomId: testRoomLargeId,
          dayOfWeek: 5, // Friday
          startTime: '09:00',
          endTime: '11:00',
          sessionType: 'LECTURE',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      scheduledSlotId = res.body.data.id;
      createdSlotIds.push(scheduledSlotId);
    });

    it('should detect ROOM CLASH when another section attempts to book the same room at overlapping time', async () => {
      // testRoomLarge already booked Friday 09:00-11:00
      // Attempting to book Section 2 on Friday 10:00-12:00 in same room
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          classSectionId: testSection2Id,
          roomId: testRoomLargeId,
          dayOfWeek: 5, // Friday
          startTime: '10:00',
          endTime: '12:00',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROOM_CLASH');
      expect(res.body.error.message).toContain('Room clash:');
      expect(res.body.error.message).toContain('already booked on Friday from 09:00 to 11:00');
    });

    it('should detect LECTURER CLASH when lecturer is booked to teach another section at overlapping time', async () => {
      // Dr. Grace Hopper is teaching Section 1 on Friday 09:00-11:00
      // Attempting to schedule Section 2 (also taught by Grace) in a DIFFERENT room (testRoomClash) on Friday 09:30-11:30
      const res = await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          classSectionId: testSection2Id,
          roomId: testRoomClashId, // Different room
          dayOfWeek: 5, // Friday
          startTime: '09:30',
          endTime: '11:30',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LECTURER_CLASH');
      expect(res.body.error.message).toContain('Lecturer schedule conflict:');
      expect(res.body.error.message).toContain('Friday from 09:00 to 11:00');
    });

    it('should update and reschedule an existing slot with clash validation', async () => {
      // Reschedule scheduledSlotId to Friday 14:00-16:00
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/timetable/slots/${scheduledSlotId}`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          startTime: '14:00',
          endTime: '16:00',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.startTime).toBe('14:00');
      expect(res.body.data.endTime).toBe('16:00');
    });
  });

  // =========================================================================
  // 3. MULTI-FORMAT TIMETABLE QUERIES
  // =========================================================================
  describe('3. Multi-Format Timetable Queries', () => {
    it('should return 7-day master timetable matrix', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/timetable/master')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.schedule)).toBe(true);
      expect(res.body.data.schedule.length).toBe(7); // Mon to Sun
    });

    it('should return personalized weekly timetable for enrolled student', async () => {
      // Alice is enrolled in testSection1, scheduled on Friday 14:00-16:00
      const res = await request(app.getHttpServer())
        .get(`/api/v1/timetable/student/${aliceStudentId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(aliceStudentId);
      const friday = res.body.data.schedule.find((d: any) => d.dayOfWeek === 5);
      expect(friday).toBeDefined();
      const slot = friday.slots.find((s: any) => s.id === scheduledSlotId);
      expect(slot).toBeDefined();
    });

    it('should return teaching schedule for lecturer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/timetable/lecturer/${lecturerStaffId}`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.lecturer.id).toBe(lecturerStaffId);
    });

    it('should return utilization schedule for a room', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/timetable/room/${testRoomLargeId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.room.id).toBe(testRoomLargeId);
      const friday = res.body.data.schedule.find((d: any) => d.dayOfWeek === 5);
      expect(friday.slots.some((s: any) => s.id === scheduledSlotId)).toBe(true);
    });

    it('should return schedule via shortcut my-schedule for authenticated student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/timetable/my-schedule')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(aliceStudentId);
    });
  });

  // =========================================================================
  // 4. ATTENDANCE SESSIONS & DYNAMIC TIME-DECAYING QR CODES
  // =========================================================================
  describe('4. Attendance Session & Dynamic QR Engine', () => {
    it('should allow lecturer to initiate attendance session with dynamic QR code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send({
          classSectionId: testSection1Id,
          sessionDate: '2026-09-22',
          startTime: '14:00',
          endTime: '16:00',
          qrExpiryMinutes: 15,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.qrToken).toBeDefined();
      expect(res.body.data.qrCodeDataUrl).toContain('data:image/png;base64');
      expect(res.body.data.validityDurationMinutes).toBe(15);

      activeAttendanceSessionId = res.body.data.id;
      activeQrToken = res.body.data.qrToken;
      createdSessionIds.push(activeAttendanceSessionId);
    });

    it('should rotate/refresh QR token for ongoing session', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${activeAttendanceSessionId}/refresh-qr?expiryMinutes=10`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.qrToken).toBeDefined();
      expect(res.body.data.qrToken).not.toBe(activeQrToken); // new token rotated
      expect(res.body.data.qrCodeDataUrl).toContain('data:image/png;base64');

      // Update active token
      activeQrToken = res.body.data.qrToken;
    });

    it('should get session details with student roster and statistics', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/sessions/${activeAttendanceSessionId}`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.session.id).toBe(activeAttendanceSessionId);
      expect(res.body.data.statistics.totalEnrolled).toBe(1); // Alice enrolled
      expect(res.body.data.roster.some((s: any) => s.studentId === aliceStudentId)).toBe(true);
    });
  });

  // =========================================================================
  // 5. STUDENT SELF-SERVICE QR CODE CHECK-IN
  // =========================================================================
  describe('5. Student Self-Service QR Code Check-In', () => {
    it('should allow enrolled student (Alice) to verify attendance via active QR token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ qrToken: activeQrToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PRESENT');
      expect(res.body.data.verificationMethod).toBe('QR_CODE');
      expect(res.body.data.message).toContain('Check-in successful');
    });

    it('should reject duplicate check-in by same student for the same session', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ qrToken: activeQrToken })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ALREADY_CHECKED_IN');
    });

    it('should reject check-in by student (Bob) not enrolled in the section (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ qrToken: activeQrToken })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('STUDENT_NOT_ENROLLED');
    });

    it('should reject check-in with invalid or expired QR token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ qrToken: 'non-existent-invalid-token' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_QR_TOKEN');
    });
  });

  // =========================================================================
  // 6. MANUAL ROSTER BATCH MARKING
  // =========================================================================
  describe('6. Manual Roster Batch Marking', () => {
    it('should allow lecturer to mark batch attendance disposition statuses', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${activeAttendanceSessionId}/mark-batch`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send({
          records: [
            {
              studentId: aliceStudentId,
              status: 'LATE',
            },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.recordsMarked).toBe(1);

      // Verify in session details: Alice status updated to LATE
      const checkRes = await request(app.getHttpServer())
        .get(`/api/v1/attendance/sessions/${activeAttendanceSessionId}`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(200);

      const aliceRecord = checkRes.body.data.roster.find((r: any) => r.studentId === aliceStudentId);
      expect(aliceRecord.status).toBe('LATE');
    });
  });

  // =========================================================================
  // 7. INSTITUTIONAL 75% EXAM ELIGIBILITY ANALYTICS
  // =========================================================================
  describe('7. Attendance Analytics & Institutional 75% Exam Eligibility Rule', () => {
    it('should evaluate student attendance rate and confirm exam eligibility when >= 75%', async () => {
      // Set Alice to PRESENT for the session
      await db.attendanceRecord.update({
        where: {
          attendanceSessionId_studentId: {
            attendanceSessionId: activeAttendanceSessionId,
            studentId: aliceStudentId,
          },
        },
        data: { status: 'PRESENT' },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/student/${aliceStudentId}/summary`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(aliceStudentId);
      const courseStat = res.body.data.courses.find((c: any) => c.classSectionId === testSection1Id);
      expect(courseStat).toBeDefined();
      expect(courseStat.attendanceRate).toBe(100);
      expect(courseStat.isEligibleForExam).toBe(true);
      expect(courseStat.warningLevel).toBe('GOOD');
    });

    it('should flag student as INELIGIBLE and WARNING when attendance falls below 75%', async () => {
      // Create 3 additional attendance sessions where Alice is absent (1 present out of 4 sessions = 25%)
      for (let i = 1; i <= 3; i++) {
        const extraSession = await db.attendanceSession.create({
          data: {
            classSectionId: testSection1Id,
            lecturerId: lecturerStaffId,
            sessionDate: new Date(`2026-09-2${i + 2}`),
            startTime: '14:00',
            endTime: '16:00',
          },
        });
        createdSessionIds.push(extraSession.id);

        await db.attendanceRecord.create({
          data: {
            attendanceSessionId: extraSession.id,
            studentId: aliceStudentId,
            status: 'ABSENT',
            verificationMethod: 'MANUAL',
          },
        });
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/student/${aliceStudentId}/summary`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const courseStat = res.body.data.courses.find((c: any) => c.classSectionId === testSection1Id);
      expect(courseStat).toBeDefined();
      expect(courseStat.attendanceRate).toBeLessThan(75);
      expect(courseStat.isEligibleForExam).toBe(false);
      expect(courseStat.warningLevel).toBe('CRITICAL'); // < 60% is CRITICAL
    });

    it('should return section audit report with count of at-risk students for deans and faculty', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/section/${testSection1Id}/report`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.section.id).toBe(testSection1Id);
      expect(res.body.data.atRiskCount).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 8. RBAC SECURITY ENFORCEMENT
  // =========================================================================
  describe('8. RBAC Security & Authorization Guards', () => {
    it('should forbid student from creating a physical room (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/timetable/rooms')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          campusId: mainCampusId,
          building: 'Hacker Hall',
          roomNumber: '999',
          capacity: 100,
        })
        .expect(403);
    });

    it('should forbid student from scheduling a timetable slot (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/timetable/slots')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          classSectionId: testSection1Id,
          roomId: testRoomLargeId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '11:00',
        })
        .expect(403);
    });

    it('should forbid student from initiating an attendance session (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          classSectionId: testSection1Id,
          sessionDate: '2026-09-30',
          startTime: '09:00',
          endTime: '11:00',
        })
        .expect(403);
    });
  });
});
