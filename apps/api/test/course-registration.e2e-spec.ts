import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform.interceptor';
import { DatabaseService } from '../src/modules/database/database.service';

describe('Phase 8: High-Concurrency Course Registration Engine E2E Suite', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Tokens
  let adminToken: string;
  let registrarToken: string;
  let aliceToken: string;
  let bobToken: string;

  // Base IDs
  let mainCampusId: string;
  let csDeptId: string;
  let activeSemesterId: string;
  let closedSemesterId: string;
  let aliceStudentId: string;
  let bobStudentId: string;

  // Concurrent Test Students
  const concurrentStudentTokens: string[] = [];
  const concurrentStudentIds: string[] = [];
  const concurrentUserIds: string[] = [];

  // Indices of successful and failed students from concurrent test
  let successfulIndex: number;
  let failedIndex: number;

  // Created Test Courses & Sections
  const createdCourseIds: string[] = [];
  const createdSectionIds: string[] = [];
  const createdHoldIds: string[] = [];

  let testCourse1Id: string;
  let testCoursePrereqId: string;
  let testCourseHeavyId: string;
  let testCourseClashAId: string;
  let testCourseClashBId: string;
  let testCourseConcurrentId: string;

  let testSec1Id: string;
  let testSecPrereqId: string;
  let testSecHeavyId: string;
  let testSecClashAId: string;
  let testSecClashBId: string;
  let testSecConcurrentId: string;

  let testRoomId: string;

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

    const aliceStudent = await db.student.findFirst({
      where: { admissionNumber: 'ADM-2026-0001' },
    });
    aliceStudentId = aliceStudent!.id;

    const bobStudent = await db.student.findFirst({
      where: { admissionNumber: 'ADM-2026-0002' },
    });
    bobStudentId = bobStudent!.id;

    // Create a Room for timetable clash tests
    const room = await db.room.create({
      data: {
        campusId: mainCampusId,
        building: 'Turing Hall',
        roomNumber: `TH-${Date.now() % 10000}`,
        capacity: 100,
        roomType: 'LECTURE_HALL',
      },
    });
    testRoomId = room.id;

    // Create a closed semester for window validation test
    const closedSem = await db.semester.create({
      data: {
        academicYearId: sem!.academicYearId,
        name: `Closed Test Sem ${Date.now()}`,
        code: `SEM-CLOSED-${Date.now()}`,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-05-30'),
        registrationStart: new Date('2024-12-01T00:00:00Z'),
        registrationEnd: new Date('2024-12-20T23:59:59Z'),
        isClosed: true,
      },
    });
    closedSemesterId = closedSem.id;

    // 3. Create Dedicated Test Courses
    // A: Introductory Course (3 CH)
    const c1 = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TCS-101-${Date.now() % 10000}`,
        title: 'Foundations of Computing',
        creditHours: 3,
        contactHours: 3,
        level: 100,
      },
    });
    testCourse1Id = c1.id;
    createdCourseIds.push(c1.id);

    // B: Advanced Course (3 CH) with Prerequisite = c1
    const cPrereq = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TCS-201-${Date.now() % 10000}`,
        title: 'Advanced Data Structures',
        creditHours: 3,
        contactHours: 3,
        level: 200,
      },
    });
    testCoursePrereqId = cPrereq.id;
    createdCourseIds.push(cPrereq.id);

    await db.coursePrerequisite.create({
      data: {
        courseId: cPrereq.id,
        prerequisiteCourseId: c1.id,
        minGradeRequired: 'C',
        type: 'PREREQUISITE',
      },
    });

    // C: Heavy Course (22 CH) - Exceeds max semester credits (21)
    const cHeavy = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TCS-999-${Date.now() % 10000}`,
        title: 'Comprehensive Research Monograph',
        creditHours: 22,
        contactHours: 22,
        level: 400,
      },
    });
    testCourseHeavyId = cHeavy.id;
    createdCourseIds.push(cHeavy.id);

    // D & E: Timetable Clash Courses (Wednesday 10:00-12:00 and Wednesday 11:00-13:00)
    const cClashA = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TCS-CLA-${Date.now() % 10000}`,
        title: 'Clash Testing A',
        creditHours: 3,
        contactHours: 3,
        level: 100,
      },
    });
    testCourseClashAId = cClashA.id;
    createdCourseIds.push(cClashA.id);

    const cClashB = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TCS-CLB-${Date.now() % 10000}`,
        title: 'Clash Testing B',
        creditHours: 3,
        contactHours: 3,
        level: 100,
      },
    });
    testCourseClashBId = cClashB.id;
    createdCourseIds.push(cClashB.id);

    // F: Concurrency Course (capacity = 2)
    const cConc = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `TCS-CON-${Date.now() % 10000}`,
        title: 'High Concurrency Systems Lab',
        creditHours: 3,
        contactHours: 3,
        level: 300,
      },
    });
    testCourseConcurrentId = cConc.id;
    createdCourseIds.push(cConc.id);

    // 4. Create Sections for Courses
    const sec1 = await db.classSection.create({
      data: {
        courseId: testCourse1Id,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        sectionName: 'Sec-101-Main',
        capacity: 50,
        enrolledCount: 0,
      },
    });
    testSec1Id = sec1.id;
    createdSectionIds.push(sec1.id);

    const secPrereq = await db.classSection.create({
      data: {
        courseId: testCoursePrereqId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        sectionName: 'Sec-201-Main',
        capacity: 50,
        enrolledCount: 0,
      },
    });
    testSecPrereqId = secPrereq.id;
    createdSectionIds.push(secPrereq.id);

    const secHeavy = await db.classSection.create({
      data: {
        courseId: testCourseHeavyId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        sectionName: 'Sec-Heavy',
        capacity: 10,
        enrolledCount: 0,
      },
    });
    testSecHeavyId = secHeavy.id;
    createdSectionIds.push(secHeavy.id);

    // Clash Sections with timetable slots (Wednesday = day 3)
    const secClashA = await db.classSection.create({
      data: {
        courseId: testCourseClashAId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        sectionName: 'Sec-Clash-A',
        capacity: 30,
        enrolledCount: 0,
      },
    });
    testSecClashAId = secClashA.id;
    createdSectionIds.push(secClashA.id);

    await db.timetableSlot.create({
      data: {
        classSectionId: secClashA.id,
        roomId: testRoomId,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '12:00',
        sessionType: 'LECTURE',
      },
    });

    const secClashB = await db.classSection.create({
      data: {
        courseId: testCourseClashBId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        sectionName: 'Sec-Clash-B',
        capacity: 30,
        enrolledCount: 0,
      },
    });
    testSecClashBId = secClashB.id;
    createdSectionIds.push(secClashB.id);

    await db.timetableSlot.create({
      data: {
        classSectionId: secClashB.id,
        roomId: testRoomId,
        dayOfWeek: 3, // Wednesday (Overlaps 11:00-13:00 with 10:00-12:00)
        startTime: '11:00',
        endTime: '13:00',
        sessionType: 'LECTURE',
      },
    });

    // Concurrency Section (Capacity = 2)
    const secConc = await db.classSection.create({
      data: {
        courseId: testCourseConcurrentId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        sectionName: 'Sec-Concurrent-Tight',
        capacity: 2,
        enrolledCount: 0,
      },
    });
    testSecConcurrentId = secConc.id;
    createdSectionIds.push(secConc.id);

    // 5. Create 4 Concurrent Test Students for Concurrency Stress Test
    const studentRole = await db.role.findUnique({ where: { code: 'STUDENT' } });
    const pwHash = await argon2.hash('Password@2026!');
    const prog = await db.program.findFirst({ where: { code: 'BCS' } });

    for (let i = 1; i <= 4; i++) {
      const uEmail = `conc.student.${i}.${Date.now()}@chuoms.edu`;
      const u = await db.user.create({
        data: {
          email: uEmail,
          username: `conc_student_${i}_${Date.now() % 10000}`,
          admissionNumber: `ADM-CONC-${i}-${Date.now() % 10000}`,
          firstName: `Concurrent${i}`,
          lastName: 'Tester',
          passwordHash: pwHash,
          isActive: true,
        },
      });
      concurrentUserIds.push(u.id);

      await db.userRole.create({
        data: {
          userId: u.id,
          roleId: studentRole!.id,
          scopeType: 'SELF',
        },
      });

      const s = await db.student.create({
        data: {
          userId: u.id,
          campusId: mainCampusId,
          programId: prog!.id,
          admissionNumber: u.admissionNumber!,
          status: 'ACTIVE',
          cohortYear: 2026,
          currentLevel: 100,
          admissionDate: new Date('2026-09-01T00:00:00Z'),
          gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
          nationality: 'Kenyan',
        },
      });
      concurrentStudentIds.push(s.id);

      // Login concurrent student
      const cRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: uEmail, password: 'Password@2026!' });
      concurrentStudentTokens.push(cRes.body.data.accessToken);
    }
  });

  afterAll(async () => {
    // Cleanup created test resources in reverse dependency order
    try {
      // 1. Delete holds
      await db.financialHold.deleteMany({
        where: { id: { in: createdHoldIds } },
      });

      // 2. Delete test enrollments
      await db.enrollment.deleteMany({
        where: {
          OR: [
            { classSectionId: { in: createdSectionIds } },
            { studentId: { in: concurrentStudentIds } },
            { studentId: aliceStudentId, classSectionId: { in: createdSectionIds } },
            { studentId: bobStudentId, classSectionId: { in: createdSectionIds } },
          ],
        },
      });

      // 3. Delete timetable slots
      await db.timetableSlot.deleteMany({
        where: { classSectionId: { in: createdSectionIds } },
      });

      // 4. Delete sections
      await db.classSection.deleteMany({
        where: { id: { in: createdSectionIds } },
      });

      // 5. Delete prerequisites & courses
      await db.coursePrerequisite.deleteMany({
        where: {
          OR: [
            { courseId: { in: createdCourseIds } },
            { prerequisiteCourseId: { in: createdCourseIds } },
          ],
        },
      });
      await db.course.deleteMany({
        where: { id: { in: createdCourseIds } },
      });

      // 6. Delete closed semester & room
      if (closedSemesterId) {
        await db.semester.delete({ where: { id: closedSemesterId } });
      }
      if (testRoomId) {
        await db.room.delete({ where: { id: testRoomId } });
      }

      // 7. Delete concurrent test students & users
      if (concurrentStudentIds.length > 0) {
        await db.student.deleteMany({ where: { id: { in: concurrentStudentIds } } });
      }
      if (concurrentUserIds.length > 0) {
        await db.userRole.deleteMany({ where: { userId: { in: concurrentUserIds } } });
        await db.userSession.deleteMany({ where: { userId: { in: concurrentUserIds } } });
        await db.user.deleteMany({ where: { id: { in: concurrentUserIds } } });
      }
    } catch (e) {
      // Cleanup safe ignore
    }

    await app.close();
  });

  // =========================================================================
  // 1. REGISTRATION WINDOW ENFORCEMENT
  // =========================================================================
  describe('1. Registration Window Enforcement', () => {
    it('should query active registration window status successfully', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/registration/window/${activeSemesterId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.semesterId).toBe(activeSemesterId);
      expect(res.body.data.isOpen).toBe(true);
      expect(res.body.data.isClosed).toBe(false);
      expect(res.body.data.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should reject registration when the semester window is closed', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          semesterId: closedSemesterId,
          classSectionIds: [testSec1Id],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REGISTRATION_WINDOW_CLOSED');
    });
  });

  // =========================================================================
  // 2. FINANCIAL & ADMINISTRATIVE HOLD BLOCKING
  // =========================================================================
  describe('2. Financial & Administrative Hold Blocking', () => {
    let placedHoldId: string;

    it('should allow Registrar / Finance Officer to place a hold on student', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/registration/holds')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          studentId: bobStudentId,
          reason: 'Outstanding tuition balance of USD 1,500.00 for prior term',
          thresholdAmount: 1500,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.isActive).toBe(true);
      placedHoldId = res.body.data.id;
      createdHoldIds.push(placedHoldId);
    });

    it('should verify hold shows up under student hold report', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/registration/holds/${bobStudentId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.hasActiveHolds).toBe(true);
      expect(res.body.data.activeHoldsCount).toBeGreaterThanOrEqual(1);
    });

    it('should block course registration for student with active hold (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSec1Id],
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REGISTRATION_HOLD_BLOCKED');
      expect(res.body.error.message).toContain('Outstanding tuition balance');
    });

    it('should release hold and restore registration access for the student', async () => {
      const releaseRes = await request(app.getHttpServer())
        .patch(`/api/v1/registration/holds/${placedHoldId}/release`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          reason: 'Tuition clearance verified via bank draft',
        })
        .expect(200);

      expect(releaseRes.body.success).toBe(true);
      expect(releaseRes.body.data.isActive).toBe(false);

      // Verify holds report now shows clear
      const checkRes = await request(app.getHttpServer())
        .get(`/api/v1/registration/holds/${bobStudentId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      expect(checkRes.body.data.hasActiveHolds).toBe(false);
    });
  });

  // =========================================================================
  // 3. CREDIT LIMITS ENFORCEMENT (3 - 21 CREDIT HOURS)
  // =========================================================================
  describe('3. Credit Limits Enforcement', () => {
    it('should reject registration if requested credits exceed max limit (21 CH)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecHeavyId], // 22 Credit Hours
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CREDIT_LIMIT_EXCEEDED');
      expect(res.body.error.message).toContain('maximum allowed semester credits (21 credits)');
    });
  });

  // =========================================================================
  // 4. PREREQUISITE VALIDATION
  // =========================================================================
  describe('4. Prerequisite Validation', () => {
    it('should block registration when student has not completed prerequisite course', async () => {
      // testSecPrereqId (TCS-201) requires TCS-101
      const res = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecPrereqId],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PREREQUISITE_NOT_MET');
      expect(res.body.error.message).toContain('Missing prerequisite course');
    });

    it('should permit registration after prerequisite course is enrolled or completed', async () => {
      // Enroll Bob in testSec1Id (TCS-101)
      const enrollPrereqRes = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSec1Id],
        })
        .expect(201);

      expect(enrollPrereqRes.body.success).toBe(true);

      // Now Bob can register for testSecPrereqId (TCS-201)
      const enrollAdvancedRes = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecPrereqId],
        })
        .expect(201);

      expect(enrollAdvancedRes.body.success).toBe(true);
      expect(enrollAdvancedRes.body.data.registeredSections.length).toBe(1);

      // Clean up enrollments for Bob
      await db.enrollment.deleteMany({
        where: { studentId: bobStudentId, classSectionId: { in: [testSec1Id, testSecPrereqId] } },
      });
      await db.classSection.update({
        where: { id: testSec1Id },
        data: { enrolledCount: 0 },
      });
      await db.classSection.update({
        where: { id: testSecPrereqId },
        data: { enrolledCount: 0 },
      });
    });
  });

  // =========================================================================
  // 5. TIMETABLE CLASH DETECTION
  // =========================================================================
  describe('5. Timetable Clash Detection', () => {
    it('should detect clash when registering two overlapping sections in the same request', async () => {
      // testSecClashA (Wednesday 10:00-12:00) and testSecClashB (Wednesday 11:00-13:00)
      const res = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecClashAId, testSecClashBId],
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TIMETABLE_CLASH');
      expect(res.body.error.message).toContain('Timetable conflict detected on Wednesday');
    });

    it('should detect clash when registering a section that conflicts with an already-enrolled section', async () => {
      // 1. Enroll Alice in testSecClashA (Wednesday 10:00-12:00)
      const enrollRes = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecClashAId],
        })
        .expect(201);

      expect(enrollRes.body.success).toBe(true);

      // 2. Attempt to subsequently enroll Alice in testSecClashB (Wednesday 11:00-13:00)
      const clashRes = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecClashBId],
        })
        .expect(409);

      expect(clashRes.body.success).toBe(false);
      expect(clashRes.body.error.code).toBe('TIMETABLE_CLASH');

      // Clean up Alice's clash enrollment
      await db.enrollment.deleteMany({
        where: { studentId: aliceStudentId, classSectionId: testSecClashAId },
      });
      await db.classSection.update({
        where: { id: testSecClashAId },
        data: { enrolledCount: 0 },
      });
    });
  });

  // =========================================================================
  // 6. HIGH-CONCURRENCY PESSIMISTIC LOCKING & OVERBOOKING PREVENTION
  // =========================================================================
  describe('6. High-Concurrency Pessimistic Row Locking (SELECT ... FOR UPDATE)', () => {
    it('should strictly serialize concurrent registrations and prevent over-enrollment beyond section capacity', async () => {
      // testSecConcurrent has capacity = 2
      // 4 concurrent students attempt to register simultaneously via Promise.all
      const requests = concurrentStudentTokens.map((token) =>
        request(app.getHttpServer())
          .post('/api/v1/registration/enroll')
          .set('Authorization', `Bearer ${token}`)
          .send({
            semesterId: activeSemesterId,
            classSectionIds: [testSecConcurrentId],
          }),
      );

      const responses = await Promise.all(requests);

      const successfulResponses = responses.filter((r) => r.status === 201);
      const conflictResponses = responses.filter((r) => r.status === 409);

      // Exactly 2 must succeed (capacity = 2)
      expect(successfulResponses.length).toBe(2);
      // Remaining 2 must be rejected due to capacity full
      expect(conflictResponses.length).toBe(2);

      conflictResponses.forEach((res) => {
        expect(res.body.error.code).toBe('SECTION_CAPACITY_FULL');
        expect(res.body.error.message).toContain('is full (2/2 seats)');
      });

      // Save indices of successful and failed students for subsequent drop & re-enroll tests
      successfulIndex = responses.findIndex((r) => r.status === 201);
      failedIndex = responses.findIndex((r) => r.status === 409);

      // Verify in PostgreSQL database: enrolledCount MUST be strictly 2
      const verifiedSection = await db.classSection.findUnique({
        where: { id: testSecConcurrentId },
      });
      expect(verifiedSection!.enrolledCount).toBe(2);
      expect(verifiedSection!.enrolledCount).toBeLessThanOrEqual(verifiedSection!.capacity);
    });
  });

  // =========================================================================
  // 7. ATOMIC COURSE DROP & SEAT CAPACITY RESTORATION
  // =========================================================================
  describe('7. Course Drop & Seat Capacity Restoration', () => {
    it('should allow enrolled student to drop course and restore seat capacity', async () => {
      // Pick the student who definitely succeeded in concurrent test
      const enrolledStudentToken = concurrentStudentTokens[successfulIndex];

      const dropRes = await request(app.getHttpServer())
        .post('/api/v1/registration/drop')
        .set('Authorization', `Bearer ${enrolledStudentToken}`)
        .send({
          classSectionId: testSecConcurrentId,
          reason: 'Elective adjustment',
        })
        .expect(200);

      expect(dropRes.body.success).toBe(true);
      expect(dropRes.body.data.status).toBe('DROPPED');
      expect(dropRes.body.data.message).toContain('Class seat capacity has been restored');

      // Verify in DB: enrolledCount is now 1
      const sectionAfterDrop = await db.classSection.findUnique({
        where: { id: testSecConcurrentId },
      });
      expect(sectionAfterDrop!.enrolledCount).toBe(1);
    });

    it('should allow a previously rejected student to claim the released seat', async () => {
      // Pick the student who was rejected in the concurrent test
      const lateStudentToken = concurrentStudentTokens[failedIndex];

      const lateEnrollRes = await request(app.getHttpServer())
        .post('/api/v1/registration/enroll')
        .set('Authorization', `Bearer ${lateStudentToken}`)
        .send({
          semesterId: activeSemesterId,
          classSectionIds: [testSecConcurrentId],
        })
        .expect(201);

      expect(lateEnrollRes.body.success).toBe(true);
      expect(lateEnrollRes.body.data.registeredSections.length).toBe(1);

      // Enrolled count is back to full (2)
      const sectionRebooked = await db.classSection.findUnique({
        where: { id: testSecConcurrentId },
      });
      expect(sectionRebooked!.enrolledCount).toBe(2);
    });
  });

  // =========================================================================
  // 8. ACTIVE REGISTRATIONS & RBAC QUERIES
  // =========================================================================
  describe('8. Student & Registrar Enrollment Inspection', () => {
    it('should list available sections with real-time seat availability', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/registration/sections?semesterId=${activeSemesterId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const testSection = res.body.data.find((s: any) => s.id === testSecConcurrentId);
      expect(testSection).toBeDefined();
      expect(testSection.isFull).toBe(true);
      expect(testSection.seatsAvailable).toBe(0);
    });

    it('should allow student to query their own enrollments via my-enrollments', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/registration/my-enrollments?semesterId=${activeSemesterId}`)
        .set('Authorization', `Bearer ${concurrentStudentTokens[failedIndex]}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.enrollmentCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalCredits).toBeGreaterThanOrEqual(3);
    });

    it('should allow Registrar to query student enrollments', async () => {
      const targetStudentId = concurrentStudentIds[failedIndex];
      const res = await request(app.getHttpServer())
        .get(`/api/v1/registration/student/${targetStudentId}?semesterId=${activeSemesterId}`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(targetStudentId);
    });

    it('should forbid regular student from viewing another student registrations (403 Forbidden)', async () => {
      const targetStudentId = concurrentStudentIds[failedIndex];
      await request(app.getHttpServer())
        .get(`/api/v1/registration/student/${targetStudentId}?semesterId=${activeSemesterId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });
  });
});
