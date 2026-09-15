import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform.interceptor';
import { DatabaseService } from '../src/modules/database/database.service';

describe('Phase 6: Institutional Structure & Curriculum Builder E2E Suite', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let adminToken: string;
  let registrarToken: string;
  let studentToken: string;

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

    // Login Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@edutech.edu', password: 'Password@2026!' });
    adminToken = adminRes.body.data.accessToken;

    // Login Registrar
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'registrar@edutech.edu', password: 'Password@2026!' });
    registrarToken = regRes.body.data.accessToken;

    // Login Student
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'alice.johnson@student.edutech.edu', password: 'Password@2026!' });
    studentToken = studentRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. INSTITUTIONAL ORGANIZATION & MULTI-CAMPUS HIERARCHY
  // =========================================================================
  describe('1. Institutional Organization Hierarchy', () => {
    it('should fetch full institutional hierarchy tree', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/organization/hierarchy')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.campuses).toBeInstanceOf(Array);
      expect(res.body.data.campuses.length).toBeGreaterThanOrEqual(1);

      const mainCampus = res.body.data.campuses[0];
      expect(mainCampus.faculties).toBeInstanceOf(Array);
      expect(mainCampus.faculties.length).toBeGreaterThanOrEqual(1);

      const faculty = mainCampus.faculties[0];
      expect(faculty.departments).toBeInstanceOf(Array);
      expect(faculty.departments.length).toBeGreaterThanOrEqual(1);

      const dept = faculty.departments[0];
      expect(dept.programs).toBeInstanceOf(Array);
    });

    it('should forbid unauthenticated users from accessing hierarchy (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/organization/hierarchy')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should allow student to view campuses but forbid campus creation (403 Forbidden)', async () => {
      // View campuses -> allowed
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/organization/campuses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

      // Create campus as student -> forbidden
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/organization/campuses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: 'ILLEGAL',
          name: 'Illegal Student Campus',
          address: '123 Fake St',
          city: 'City',
          country: 'Country',
        })
        .expect(403);

      expect(createRes.body.success).toBe(false);
      expect(createRes.body.error.code).toBe('PERMISSION_DENIED');
    });

    it('should create and update a campus as Registrar or Admin', async () => {
      const code = `TST-${Date.now().toString().slice(-4)}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/organization/campuses')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          code,
          name: 'Northern Technology Campus',
          address: '500 Innovation Way',
          city: 'Metropolis',
          country: 'United States',
          timezone: 'America/New_York',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(code);
      const campusId = res.body.data.id;

      // Update campus
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/organization/campuses/${campusId}`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({ name: 'Northern Technology Campus Updated' })
        .expect(200);

      expect(updateRes.body.data.name).toBe('Northern Technology Campus Updated');

      // Duplicate code check
      await request(app.getHttpServer())
        .post('/api/v1/organization/campuses')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          code,
          name: 'Duplicate Campus',
          address: '123 Fake St',
          city: 'City',
          country: 'Country',
        })
        .expect(409);
    });
  });

  // =========================================================================
  // 2. ACADEMIC CALENDAR & TERMS
  // =========================================================================
  describe('2. Academic Calendar & Terms', () => {
    it('should retrieve current active academic year', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic-terms/years/current')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isCurrent).toBe(true);
      expect(res.body.data.semesters).toBeInstanceOf(Array);
      expect(res.body.data.semesters.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject academic year creation if startDate >= endDate', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic-terms/years')
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          name: 'Invalid Year 2090/2091',
          startDate: '2091-09-01',
          endDate: '2090-09-01', // Before start
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('start date must be before end date');
    });

    it('should list semesters and filter by academicYearId', async () => {
      const currentYear = await db.academicYear.findFirst({ where: { isCurrent: true } });
      expect(currentYear).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/academic-terms/semesters?academicYearId=${currentYear!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].academicYearId).toBe(currentYear!.id);
    });
  });

  // =========================================================================
  // 3. COURSE CATALOGUE & PREREQUISITE GRAPH (BFS CYCLE DETECTION)
  // =========================================================================
  describe('3. Course Catalogue & Prerequisite Graph Engine', () => {
    let deptId: string;
    let course101Id: string;
    let course201Id: string;
    let course301Id: string;

    beforeAll(async () => {
      const dept = await db.department.findFirst();
      deptId = dept!.id;

      const suffix = Date.now().toString().slice(-4);

      // Create 3 chained courses: CS101 -> CS201 -> CS301
      const c1 = await request(app.getHttpServer())
        .post('/api/v1/curriculum/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: deptId,
          code: `CS101-${suffix}`,
          title: 'Introduction to Programming',
          creditHours: 3,
          contactHours: 3,
          level: 100,
        });
      course101Id = c1.body.data.id;

      const c2 = await request(app.getHttpServer())
        .post('/api/v1/curriculum/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: deptId,
          code: `CS201-${suffix}`,
          title: 'Data Structures and Algorithms',
          creditHours: 3,
          contactHours: 3,
          level: 200,
        });
      course201Id = c2.body.data.id;

      const c3 = await request(app.getHttpServer())
        .post('/api/v1/curriculum/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: deptId,
          code: `CS301-${suffix}`,
          title: 'Advanced Algorithms & Complexity',
          creditHours: 4,
          contactHours: 4,
          level: 300,
        });
      course301Id = c3.body.data.id;
    });

    it('should reject self-prerequisite rule with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/curriculum/courses/${course101Id}/prerequisites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prerequisiteCourseId: course101Id,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('A course cannot be a prerequisite of itself');
    });

    it('should add valid sequential prerequisites (CS201 requires CS101, CS301 requires CS201)', async () => {
      // CS201 requires CS101
      const res1 = await request(app.getHttpServer())
        .post(`/api/v1/curriculum/courses/${course201Id}/prerequisites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prerequisiteCourseId: course101Id,
          minGradeRequired: 'C',
          type: 'PREREQUISITE',
        })
        .expect(201);

      expect(res1.body.success).toBe(true);
      expect(res1.body.data.courseId).toBe(course201Id);
      expect(res1.body.data.prerequisiteCourseId).toBe(course101Id);

      // CS301 requires CS201
      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/curriculum/courses/${course301Id}/prerequisites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prerequisiteCourseId: course201Id,
          minGradeRequired: 'C',
          type: 'PREREQUISITE',
        })
        .expect(201);

      expect(res2.body.success).toBe(true);
    });

    it('should detect and reject cyclic prerequisite dependency with 400 Bad Request', async () => {
      // We have CS101 -> CS201 -> CS301 (CS301 depends on CS201 depends on CS101)
      // Attempting to make CS101 depend on CS301 creates a cycle (CS101 -> CS301 -> CS201 -> CS101)
      const res = await request(app.getHttpServer())
        .post(`/api/v1/curriculum/courses/${course101Id}/prerequisites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prerequisiteCourseId: course301Id,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Cyclic prerequisite dependency detected');
    });

    it('should fetch the multi-tier prerequisite DAG for CS301', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/curriculum/courses/${course301Id}/prerequisite-graph`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPrerequisites).toBe(2);
      expect(res.body.data.nodes.length).toBe(3); // CS301, CS201, CS101
      expect(res.body.data.edges.length).toBe(2);
    });

    it('should remove a prerequisite requirement cleanly', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/curriculum/courses/${course301Id}/prerequisites/${course201Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify prerequisite count decreased
      const graphRes = await request(app.getHttpServer())
        .get(`/api/v1/curriculum/courses/${course301Id}/prerequisite-graph`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(graphRes.body.data.totalPrerequisites).toBe(0);
    });
  });

  // =========================================================================
  // 4. CURRICULUM VERSIONING & DEGREE AUDIT ENGINE
  // =========================================================================
  describe('4. Curriculum Versioning & Degree Audit Engine', () => {
    let programId: string;
    let versionId: string;
    let courseAId: string;
    let courseBId: string;

    beforeAll(async () => {
      const prog = await db.program.findFirst();
      programId = prog!.id;

      const suffix = Date.now().toString().slice(-4);

      // Create Course A & Course B, where Course B requires Course A
      const cA = await request(app.getHttpServer())
        .post('/api/v1/curriculum/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: prog!.departmentId,
          code: `AUD-A-${suffix}`,
          title: 'Prerequisite Course A',
          creditHours: 4,
          level: 100,
        });
      courseAId = cA.body.data.id;

      const cB = await request(app.getHttpServer())
        .post('/api/v1/curriculum/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: prog!.departmentId,
          code: `AUD-B-${suffix}`,
          title: 'Dependent Course B',
          creditHours: 4,
          level: 200,
        });
      courseBId = cB.body.data.id;

      // Make Course B require Course A
      await request(app.getHttpServer())
        .post(`/api/v1/curriculum/courses/${courseBId}/prerequisites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prerequisiteCourseId: courseAId,
          minGradeRequired: 'C',
        });
    });

    it('should create a new curriculum version for a program', async () => {
      const versionName = `2026-Cohort-Test-${Date.now().toString().slice(-4)}`;
      const res = await request(app.getHttpServer())
        .post(`/api/v1/curriculum/programs/${programId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          versionName,
          academicYear: 2026,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.versionName).toBe(versionName);
      versionId = res.body.data.id;
    });

    it('should perform degree audit and report credit deficit when credits are insufficient', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/curriculum/versions/${versionId}/audit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(false);
      expect(res.body.data.issuesCount).toBeGreaterThanOrEqual(1);

      const deficitIssue = res.body.data.issues.find(
        (i: any) => i.type === 'CREDIT_DEFICIT',
      );
      expect(deficitIssue).toBeDefined();
    });

    it('should detect prerequisite sequence violation when dependent course is scheduled before prerequisite', async () => {
      // Schedule dependent Course B in Year 1 Sem 1
      await request(app.getHttpServer())
        .post(`/api/v1/curriculum/versions/${versionId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: courseBId,
          yearOfStudy: 1,
          semesterNumber: 1,
          isCore: true,
        })
        .expect(201);

      // Schedule prerequisite Course A in Year 2 Sem 1 (Later term -> sequence violation!)
      await request(app.getHttpServer())
        .post(`/api/v1/curriculum/versions/${versionId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: courseAId,
          yearOfStudy: 2,
          semesterNumber: 1,
          isCore: true,
        })
        .expect(201);

      // Audit should report PREREQUISITE_SEQUENCE_VIOLATION
      const auditRes = await request(app.getHttpServer())
        .get(`/api/v1/curriculum/versions/${versionId}/audit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(auditRes.body.success).toBe(true);
      const seqViolation = auditRes.body.data.issues.find(
        (i: any) => i.type === 'PREREQUISITE_SEQUENCE_VIOLATION',
      );
      expect(seqViolation).toBeDefined();
      expect(seqViolation.message).toContain('is scheduled concurrently or later');
    });
  });
});
