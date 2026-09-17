import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform.interceptor';
import { DatabaseService } from '../src/modules/database/database.service';
import * as argon2 from 'argon2';

describe('Phase 10: Assessments, Secure Gradebook & GPA Progression E2E Suite', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Authentication Tokens
  let adminToken: string;
  let registrarToken: string;
  let assignedLecturerToken: string;
  let unassignedLecturerToken: string;
  let hodToken: string;
  let deanToken: string;
  let aliceToken: string;
  let bobToken: string;
  let defaultPasswordHash: string;

  // Base IDs
  let mainCampusId: string;
  let csDeptId: string;
  let activeSemesterId: string;
  let assignedStaffId: string;
  let unassignedStaffId: string;
  let aliceStudentId: string;
  let bobStudentId: string;

  // Test Entities
  let testCourseId: string;
  let testSectionId: string;
  let aliceEnrollmentId: string;
  let bobEnrollmentId: string;

  let testCat1Id: string;
  let testFinalExamId: string;
  let aliceGradeId: string;
  let bobGradeId: string;

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

    // 1. Fetch Reference Entities
    const campus = await db.campus.findFirst({ where: { code: 'MAIN' } });
    mainCampusId = campus!.id;

    const dept = await db.department.findFirst({ where: { code: 'CS' } });
    csDeptId = dept!.id;

    const sem = await db.semester.findFirst({ where: { code: '2026-SEM1' } });
    activeSemesterId = sem!.id;

    // Assigned Lecturer: Dr. Alan Smith (STF-CS-001)
    const staff1 = await db.staff.findFirst({ where: { staffNumber: 'STF-CS-001' } });
    assignedStaffId = staff1!.id;

    // Unassigned Lecturer: Dr. Grace Hopper (STF-SE-001)
    const staff2 = await db.staff.findFirst({ where: { staffNumber: 'STF-SE-001' } });
    unassignedStaffId = staff2!.id;

    // Students: Alice & Bob
    const alice = await db.student.findFirst({ where: { admissionNumber: 'ADM-2026-0001' } });
    aliceStudentId = alice!.id;

    const bob = await db.student.findFirst({ where: { admissionNumber: 'ADM-2026-0002' } });
    bobStudentId = bob!.id;

    // 2. Ensure HoD and Dean Users Exist
    defaultPasswordHash = await argon2.hash('Password@2026!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const hodRole = await db.role.findFirst({ where: { code: 'HEAD_OF_DEPARTMENT' } });
    let hodUser = await db.user.findFirst({ where: { email: 'hod.cs@chuoms.edu' } });
    if (!hodUser) {
      hodUser = await db.user.create({
        data: {
          email: 'hod.cs@chuoms.edu',
          username: 'hod.cs',
          firstName: 'Charles',
          lastName: 'Babbage',
          passwordHash: defaultPasswordHash,
          isActive: true,
          userRoles: {
            create: {
              roleId: hodRole!.id,
              scopeType: 'DEPARTMENT',
              scopeId: csDeptId,
            },
          },
        },
      });
    }

    const deanRole = await db.role.findFirst({ where: { code: 'DEAN' } });
    let deanUser = await db.user.findFirst({ where: { email: 'dean.fci@chuoms.edu' } });
    if (!deanUser) {
      deanUser = await db.user.create({
        data: {
          email: 'dean.fci@chuoms.edu',
          username: 'dean.fci',
          firstName: 'Ada',
          lastName: 'Lovelace',
          passwordHash: defaultPasswordHash,
          isActive: true,
          userRoles: {
            create: {
              roleId: deanRole!.id,
              scopeType: 'FACULTY',
            },
          },
        },
      });
    }

    // 3. Authenticate All Actors
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@chuoms.edu', password: 'Password@2026!' });
    adminToken = adminRes.body.data.accessToken;

    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'registrar@chuoms.edu', password: 'Password@2026!' });
    registrarToken = regRes.body.data.accessToken;

    const lec1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'dr.smith@chuoms.edu', password: 'Password@2026!' });
    assignedLecturerToken = lec1Res.body.data.accessToken;

    const lec2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'dr.grace@chuoms.edu', password: 'Password@2026!' });
    unassignedLecturerToken = lec2Res.body.data.accessToken;

    const hodRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'hod.cs@chuoms.edu', password: 'Password@2026!' });
    hodToken = hodRes.body.data.accessToken;

    const deanRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'dean.fci@chuoms.edu', password: 'Password@2026!' });
    deanToken = deanRes.body.data.accessToken;

    const aliceRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'alice.johnson@student.chuoms.edu', password: 'Password@2026!' });
    aliceToken = aliceRes.body.data.accessToken;

    const bobRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'bob.miller@student.chuoms.edu', password: 'Password@2026!' });
    bobToken = bobRes.body.data.accessToken;

    // 4. Create Dedicated Test Course & Class Section
    const suffix = Date.now() % 10000;
    const testCourse = await db.course.create({
      data: {
        departmentId: csDeptId,
        code: `GRD-${suffix}`,
        title: 'Advanced Database Systems & Query Optimization',
        creditHours: 3,
        contactHours: 3,
        level: 300,
      },
    });
    testCourseId = testCourse.id;

    const testSection = await db.classSection.create({
      data: {
        courseId: testCourseId,
        semesterId: activeSemesterId,
        campusId: mainCampusId,
        primaryLecturerId: assignedStaffId,
        sectionName: `Grading Section ${suffix}`,
        capacity: 40,
        enrolledCount: 2,
      },
    });
    testSectionId = testSection.id;

    // Enroll Alice and Bob
    const enrollAlice = await db.enrollment.create({
      data: {
        studentId: aliceStudentId,
        classSectionId: testSectionId,
        semesterId: activeSemesterId,
        status: 'ENROLLED',
      },
    });
    aliceEnrollmentId = enrollAlice.id;

    const enrollBob = await db.enrollment.create({
      data: {
        studentId: bobStudentId,
        classSectionId: testSectionId,
        semesterId: activeSemesterId,
        status: 'ENROLLED',
      },
    });
    bobEnrollmentId = enrollBob.id;
  });

  afterAll(async () => {
    // Cleanup created test entities
    try {
      await db.assessmentSubmission.deleteMany({
        where: { assessment: { classSectionId: testSectionId } },
      });
      await db.assessment.deleteMany({
        where: { classSectionId: testSectionId },
      });
      await db.semesterGrade.deleteMany({
        where: { enrollment: { classSectionId: testSectionId } },
      });
      await db.enrollment.deleteMany({
        where: { classSectionId: testSectionId },
      });
      await db.classSection.deleteMany({
        where: { id: testSectionId },
      });
      await db.course.deleteMany({
        where: { id: testCourseId },
      });
    } catch (e) {
      // ignore
    }
    await app.close();
  });

  // =========================================================================
  // 1. ASSESSMENT CONFIGURATION & BOUNDARY VALIDATION
  // =========================================================================
  describe('1. Assessment Configuration & Boundary Validation', () => {
    it('should allow assigned lecturer to create Continuous Assessment Test 1 (30% weight)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          name: 'Continuous Assessment Test 1 (CAT 1)',
          assessmentType: 'CAT',
          maxMarks: 30,
          weightPercentage: 30,
          dueDate: '2026-10-15T23:59:59Z',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Continuous Assessment Test 1 (CAT 1)');
      expect(Number(res.body.data.weightPercentage)).toBe(30);
      testCat1Id = res.body.data.id;
    });

    it('should allow assigned lecturer to create Final Semester Examination (70% weight)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          name: 'Final Examination',
          assessmentType: 'FINAL_EXAM',
          maxMarks: 70,
          weightPercentage: 70,
          dueDate: '2027-01-10T12:00:00Z',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(Number(res.body.data.weightPercentage)).toBe(70);
      testFinalExamId = res.body.data.id;
    });

    it('should reject creation of assessment when cumulative weight exceeds 100%', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          name: 'Bonus Quiz',
          assessmentType: 'QUIZ',
          maxMarks: 10,
          weightPercentage: 10, // 30 + 70 + 10 = 110% -> breach!
        })
        .expect(400);

      expect(res.body.error?.message || res.body.message).toContain('Total assessment weights cannot exceed 100%');
    });

    it('should reject assessment with invalid maxMarks (0 or negative)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          name: 'Invalid Test',
          assessmentType: 'LAB',
          maxMarks: 0,
          weightPercentage: 5,
        })
        .expect(400);
    });

    it('should forbid unassigned lecturer from creating assessment in this section (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${unassignedLecturerToken}`)
        .send({
          name: 'Unauthorized Quiz',
          assessmentType: 'QUIZ',
          maxMarks: 20,
          weightPercentage: 10,
        })
        .expect(403);
    });

    it('should forbid student from creating an assessment (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Student Hack',
          assessmentType: 'QUIZ',
          maxMarks: 20,
          weightPercentage: 10,
        })
        .expect(403);
    });

    it('should list assessments for section with submission statistics', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/grading/sections/${testSectionId}/assessments`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].name).toContain('CAT 1');
      expect(res.body.data[0]).toHaveProperty('submissionCount');
    });

    it('should update assessment properties successfully', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/grading/assessments/${testCat1Id}`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          name: 'Continuous Assessment Test 1 (CAT 1) - Revised',
        })
        .expect(200);

      expect(res.body.data.name).toBe('Continuous Assessment Test 1 (CAT 1) - Revised');
    });
  });

  // =========================================================================
  // 2. MARKS ENTRY, BOUNDARY CHECKS & GRADEBOOK ROSTER
  // =========================================================================
  describe('2. Assessment Marks Entry & Gradebook Calculation', () => {
    it('should batch submit CAT 1 marks for Alice (28.5/30) and Bob (18/30)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/assessments/${testCat1Id}/submissions/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          submissions: [
            { studentId: aliceStudentId, marksObtained: 28.5, feedback: 'Excellent' },
            { studentId: bobStudentId, marksObtained: 18.0, feedback: 'Satisfactory' },
          ],
        })
        .expect(201);

      expect(res.body.data.success).toBe(true);
    });

    it('should reject marks submission exceeding maxMarks (35 > 30)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/assessments/${testCat1Id}/submissions/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          submissions: [
            { studentId: aliceStudentId, marksObtained: 35.0 }, // maxMarks is 30
          ],
        })
        .expect(400);

      expect(res.body.error?.message || res.body.message).toContain('must be between 0 and maxMarks');
    });

    it('should reject negative marks submission', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/assessments/${testCat1Id}/submissions/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          submissions: [
            { studentId: aliceStudentId, marksObtained: -5.0 },
          ],
        })
        .expect(400);
    });

    it('should reject marks submission for a student not enrolled in the section', async () => {
      // Clara is not enrolled in this section
      const clara = await db.student.findFirst({ where: { admissionNumber: 'ADM-2022-0042' } });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/assessments/${testCat1Id}/submissions/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          submissions: [
            { studentId: clara!.id, marksObtained: 20.0 },
          ],
        })
        .expect(400);

      expect(res.body.error?.message || res.body.message).toContain('not actively enrolled');
    });

    it('should batch submit final examination marks for section', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/exam-marks/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          entries: [
            { studentId: aliceStudentId, examMarks: 63.5 },
            { studentId: bobStudentId, examMarks: 42.0 },
          ],
        })
        .expect(201);

      expect(res.body.data.success).toBe(true);
    });

    it('should return complete section gradebook with calculated CA, Exam, Total, Letter Grade, and GPA', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/grading/sections/${testSectionId}/gradebook`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .expect(200);

      const gradebook = res.body.data;
      expect(gradebook.sectionId).toBe(testSectionId);
      expect(gradebook.workflowStatus).toBe('DRAFT');
      expect(gradebook.roster.length).toBe(2);

      // Alice: CAT 1 (28.5/30 * 30% = 28.5) + Exam (63.5) = Total 92.0 -> Grade 'A', GP 4.0
      const aliceEntry = gradebook.roster.find((r: any) => r.studentId === aliceStudentId);
      expect(aliceEntry).toBeDefined();
      expect(aliceEntry.continuousAssessmentMarks).toBe(28.5);
      expect(aliceEntry.examMarks).toBe(63.5);
      expect(aliceEntry.totalMarks).toBe(92);
      expect(aliceEntry.letterGrade).toBe('A');
      expect(aliceEntry.gradePoint).toBe(4);
      expect(aliceEntry.workflowStatus).toBe('DRAFT');
      aliceGradeId = (await db.semesterGrade.findFirst({ where: { enrollmentId: aliceEnrollmentId } }))!.id;

      // Bob: CAT 1 (18/30 * 30% = 18.0) + Exam (42.0) = Total 60.0 -> Grade 'B', GP 3.0
      const bobEntry = gradebook.roster.find((r: any) => r.studentId === bobStudentId);
      expect(bobEntry).toBeDefined();
      expect(bobEntry.continuousAssessmentMarks).toBe(18);
      expect(bobEntry.examMarks).toBe(42);
      expect(bobEntry.totalMarks).toBe(60);
      expect(bobEntry.letterGrade).toBe('B');
      expect(bobEntry.gradePoint).toBe(3);
      bobGradeId = (await db.semesterGrade.findFirst({ where: { enrollmentId: bobEnrollmentId } }))!.id;

      // Statistics
      expect(gradebook.statistics.totalEnrolled).toBe(2);
      expect(gradebook.statistics.gradedCount).toBe(2);
      expect(gradebook.statistics.meanMarks).toBe(76);
      expect(gradebook.statistics.passRate).toBe(100);
    });
  });

  // =========================================================================
  // 3. WORKFLOW STATE MACHINE: DRAFT -> SUBMITTED -> MODERATED -> APPROVED -> PUBLISHED
  // =========================================================================
  describe('3. Grade Moderation & Publishing Workflow State Machine', () => {
    it('should forbid unassigned lecturer from submitting section grades', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/submit`)
        .set('Authorization', `Bearer ${unassignedLecturerToken}`)
        .expect(403);
    });

    it('should allow assigned lecturer to formally SUBMIT grades to Department HoD', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/submit`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('SUBMITTED');

      // Verify DB status
      const updatedGrade = await db.semesterGrade.findUnique({ where: { id: aliceGradeId } });
      expect(updatedGrade!.workflowStatus).toBe('SUBMITTED');
      expect(updatedGrade!.submittedBy).toBeDefined();
      expect(updatedGrade!.submittedAt).toBeDefined();
    });

    it('should lock gradebook: prevent mark edits once grades are in SUBMITTED state', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/exam-marks/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          entries: [{ studentId: bobStudentId, examMarks: 50.0 }],
        })
        .expect(400);

      expect(res.body.error?.message || res.body.message).toContain('cannot be modified because grades are in SUBMITTED status');
    });

    it('should appear in Department HoD pending moderation pipeline queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grading/pipeline/submitted')
        .set('Authorization', `Bearer ${hodToken}`)
        .expect(200);

      const section = res.body.data.find((s: any) => s.id === testSectionId);
      expect(section).toBeDefined();
      expect(section.workflowStatus).toBe('SUBMITTED');
    });

    it('should allow Department HoD to REQUEST REVISIONS and return section to DRAFT with remarks', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/moderate`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          action: 'REQUEST_REVISION',
          remarks: 'Please verify Bob Miller exam Section B question 4 calculation.',
        })
        .expect(200);

      expect(res.body.data.status).toBe('DRAFT');

      const bobGrade = await db.semesterGrade.findUnique({ where: { id: bobGradeId } });
      expect(bobGrade!.workflowStatus).toBe('DRAFT');
      expect(bobGrade!.remarks).toContain('Please verify Bob Miller');
    });

    it('should allow lecturer to correct Bob mark in DRAFT state and re-submit to HoD', async () => {
      // Bob exam score corrected to 52 (Total: 18 + 52 = 70 -> Grade 'A', GP 4.0)
      await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/exam-marks/batch`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          entries: [{ studentId: bobStudentId, examMarks: 52.0 }],
        })
        .expect(201);

      // Re-submit
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/submit`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('SUBMITTED');
    });

    it('should allow Department HoD to MODERATE and sign off section grades', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/moderate`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          action: 'APPROVE_MODERATION',
          remarks: 'Department exam board verified. Marks conform to standards.',
        })
        .expect(200);

      expect(res.body.data.status).toBe('MODERATED');

      const grade = await db.semesterGrade.findUnique({ where: { id: aliceGradeId } });
      expect(grade!.workflowStatus).toBe('MODERATED');
      expect(grade!.moderatedBy).toBeDefined();
    });

    it('should appear in Dean pending approval pipeline queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grading/pipeline/moderated')
        .set('Authorization', `Bearer ${deanToken}`)
        .expect(200);

      const section = res.body.data.find((s: any) => s.id === testSectionId);
      expect(section).toBeDefined();
      expect(section.workflowStatus).toBe('MODERATED');
    });

    it('should allow Faculty Dean to formally APPROVE section grades', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/approve`)
        .set('Authorization', `Bearer ${deanToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('APPROVED');

      const grade = await db.semesterGrade.findUnique({ where: { id: aliceGradeId } });
      expect(grade!.workflowStatus).toBe('APPROVED');
      expect(grade!.approvedBy).toBeDefined();
    });

    it('should forbid lecturer from publishing grades (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/publish`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .expect(403);
    });

    it('should appear in Registrar pending publication pipeline queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grading/pipeline/approved')
        .set('Authorization', `Bearer ${registrarToken}`)
        .expect(200);

      const section = res.body.data.find((s: any) => s.id === testSectionId);
      expect(section).toBeDefined();
      expect(section.workflowStatus).toBe('APPROVED');
    });

    it('should allow Registrar to PUBLISH grades and auto-trigger SGPA/CGPA progression', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/sections/${testSectionId}/publish`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('PUBLISHED');

      const aliceGrade = await db.semesterGrade.findUnique({ where: { id: aliceGradeId } });
      expect(aliceGrade!.workflowStatus).toBe('PUBLISHED');
      expect(aliceGrade!.publishedAt).toBeDefined();

      // Check that AcademicProgression was automatically generated for Alice & Bob
      const aliceProg = await db.academicProgression.findFirst({
        where: { studentId: aliceStudentId, semesterId: activeSemesterId },
      });
      expect(aliceProg).toBeDefined();
      expect(Number(aliceProg!.sgpa)).toBeGreaterThanOrEqual(2.0);
      expect(aliceProg!.academicStanding).toBe('GOOD_STANDING');
    });
  });

  // =========================================================================
  // 4. POST-PUBLICATION ELEVATED AMENDMENT & AUDIT TRAIL
  // =========================================================================
  describe('4. Post-Publication Elevated Grade Amendment', () => {
    it('should forbid lecturer from amending published grades', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${bobGradeId}/amend`)
        .set('Authorization', `Bearer ${assignedLecturerToken}`)
        .send({
          examMarks: 55.0,
          reason: 'Lecturer wants to change grade after publication',
        })
        .expect(403);
    });

    it('should reject amendment when reason is too short or empty', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${bobGradeId}/amend`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          examMarks: 55.0,
          reason: 'typo',
        })
        .expect(400);
    });

    it('should allow Registrar to amend published grade with valid reason and increment lockVersion', async () => {
      const beforeGrade = await db.semesterGrade.findUnique({ where: { id: bobGradeId } });
      const oldLock = beforeGrade!.lockVersion;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${bobGradeId}/amend`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          examMarks: 55.0,
          reason: 'Senate Executive Committee approved re-calculation following clerical error.',
        })
        .expect(200);

      expect(res.body.data.lockVersion).toBe(oldLock + 1);
      expect(Number(res.body.data.examMarks)).toBe(55);
      expect(Number(res.body.data.totalMarks)).toBe(73); // 18 + 55 = 73 -> Grade 'A'
      expect(res.body.data.letterGrade).toBe('A');

      // Verify Audit Log entry was created
      const auditEntry = await db.auditLog.findFirst({
        where: {
          resourceId: bobGradeId,
          action: 'AMEND_PUBLISHED_GRADE',
        },
      });
      expect(auditEntry).toBeDefined();
      expect(auditEntry!.reason).toContain('Senate Executive Committee');
    });
  });

  // =========================================================================
  // 5. STUDENT GRADE APPEALS
  // =========================================================================
  describe('5. Student Grade Appeals Workflow', () => {
    it('should allow student (Alice) to submit formal appeal on published grade', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${aliceGradeId}/appeal`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          reason: 'I request external review of Final Exam Question 3 concerning concurrency proofs.',
        })
        .expect(201);

      expect(res.body.data.appealStatus).toBe('PENDING');
      expect(res.body.data.appealReason).toContain('concurrency proofs');
    });

    it('should forbid Bob from appealing Alice grade (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${aliceGradeId}/appeal`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          reason: 'Attempting to appeal another student grade',
        })
        .expect(403);
    });

    it('should reject second appeal while one is already pending', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${aliceGradeId}/appeal`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          reason: 'Duplicate appeal submission attempt',
        })
        .expect(400);
    });

    it('should allow Committee / Dean to review and resolve appeal', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/grades/${aliceGradeId}/appeal/review`)
        .set('Authorization', `Bearer ${deanToken}`)
        .send({
          status: 'APPROVED',
          resolution: 'External examiner reviewed question 3. Proof is valid. Exam marks increased by +2.',
          newExamMarks: 65.5,
        })
        .expect(200);

      expect(res.body.data.appealStatus).toBe('APPROVED');
      expect(Number(res.body.data.examMarks)).toBe(65.5);
      expect(Number(res.body.data.totalMarks)).toBe(94); // 28.5 + 65.5 = 94 -> Grade 'A'
    });
  });

  // =========================================================================
  // 6. GPA & ACADEMIC PROGRESSION ENGINE
  // =========================================================================
  describe('6. GPA Engine & Academic Standing Calculations', () => {
    it('should calculate semester progression and verify GOOD_STANDING for CGPA >= 2.0', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/semesters/${activeSemesterId}/calculate-progression`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({ studentId: aliceStudentId })
        .expect(200);

      expect(res.body.data.studentId).toBe(aliceStudentId);
      expect(Number(res.body.data.sgpa)).toBe(4.0);
      expect(Number(res.body.data.cgpa)).toBe(4.0);
      expect(res.body.data.academicStanding).toBe('GOOD_STANDING');
      expect(res.body.data.creditsEarned).toBeGreaterThan(0);
    });

    it('should correctly evaluate PROBATION and SUSPENDED standing thresholds', async () => {
      // Create a temporary failing student to verify PROBATION / SUSPENDED rules
      const failUser = await db.user.create({
        data: {
          email: `probation.student.${Date.now()}@student.chuoms.edu`,
          username: `probation.${Date.now()}`,
          admissionNumber: `ADM-FAIL-${Date.now() % 1000}`,
          firstName: 'Probation',
          lastName: 'Candidate',
          passwordHash: defaultPasswordHash,
          isActive: true,
        },
      });

      const failStudent = await db.student.create({
        data: {
          userId: failUser.id,
          campusId: mainCampusId,
          programId: (await db.program.findFirst({ where: { code: 'BCS' } }))!.id,
          admissionNumber: failUser.admissionNumber!,
          status: 'ACTIVE',
          cohortYear: 2026,
          currentLevel: 100,
          admissionDate: new Date(),
        },
      });

      const failEnrollment = await db.enrollment.create({
        data: {
          studentId: failStudent.id,
          classSectionId: testSectionId,
          semesterId: activeSemesterId,
          status: 'ENROLLED',
        },
      });

      // Grade with F (0.00 GP)
      await db.semesterGrade.create({
        data: {
          enrollmentId: failEnrollment.id,
          continuousAssessmentMarks: 10,
          examMarks: 15,
          totalMarks: 25,
          letterGrade: 'F',
          gradePoint: 0.0,
          workflowStatus: 'PUBLISHED',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/grading/semesters/${activeSemesterId}/calculate-progression`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({ studentId: failStudent.id })
        .expect(200);

      // Failing student with CGPA < 1.0 receives SUSPENDED
      expect(Number(res.body.data.cgpa)).toBe(0.0);
      expect(res.body.data.academicStanding).toBe('SUSPENDED');
      expect(res.body.data.creditsEarned).toBe(0);

      // Clean up failing student test entities
      await db.semesterGrade.deleteMany({ where: { enrollmentId: failEnrollment.id } });
      await db.academicProgression.deleteMany({ where: { studentId: failStudent.id } });
      await db.enrollment.deleteMany({ where: { id: failEnrollment.id } });
      await db.student.deleteMany({ where: { id: failStudent.id } });
      await db.user.deleteMany({ where: { id: failUser.id } });
    });
  });

  // =========================================================================
  // 7. TRANSCRIPTS & STUDENT PORTAL VIEWS
  // =========================================================================
  describe('7. Transcripts & Student Portal Queries', () => {
    it('should allow student (Alice) to view her own published grades and progression via /my-grades', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grading/my-grades')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body.data.studentInfo.admissionNumber).toBe('ADM-2026-0001');
      expect(res.body.data.cumulativeSummary.cgpa).toBe(4.0);
      expect(res.body.data.cumulativeSummary.currentStanding).toBe('GOOD_STANDING');
      expect(res.body.data.semesters.length).toBeGreaterThan(0);
    });

    it('should generate official transcript with program, department, and faculty details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/grading/students/${aliceStudentId}/transcript?official=true`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .expect(200);

      const transcript = res.body.data;
      expect(transcript.isOfficial).toBe(true);
      expect(transcript.studentInfo.programCode).toBe('BCS');
      expect(transcript.studentInfo.department).toBe('Department of Computer Science');
      expect(transcript.studentInfo.faculty).toBe('Faculty of Computing & Informatics');
      expect(transcript.semesters[0].courses.length).toBeGreaterThan(0);
    });

    it('should forbid Alice from requesting Bob official transcript (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/grading/students/${bobStudentId}/transcript`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });
  });
});
