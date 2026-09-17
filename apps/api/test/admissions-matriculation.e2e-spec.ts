import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform.interceptor';
import { DatabaseService } from '../src/modules/database/database.service';

describe('Phase 7: Admissions & Matriculation Pipeline E2E Suite', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let adminToken: string;
  let registrarToken: string;
  let studentToken: string;
  let testProgramId: string;
  let testCampusId: string;
  let createdApplicantId: string;
  let createdAppNumber: string;
  const testEmail = `e2e.applicant.${Date.now()}@example.com`;
  const testPhone = `+254${Math.floor(700000000 + Math.random() * 99999999)}`;

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
      .send({ identifier: 'admin@chuoms.edu', password: 'Password@2026!' });
    adminToken = adminRes.body.data.accessToken;

    // Login Registrar
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'registrar@chuoms.edu', password: 'Password@2026!' });
    registrarToken = regRes.body.data.accessToken;

    // Login Student
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'alice.johnson@student.chuoms.edu', password: 'Password@2026!' });
    studentToken = studentRes.body.data.accessToken;

    // Fetch active program and campus
    const prog = await db.program.findFirst({ where: { code: 'BCS' } });
    testProgramId = prog!.id;

    const camp = await db.campus.findFirst({ where: { code: 'MAIN' } });
    testCampusId = camp!.id;
  });

  afterAll(async () => {
    // Clean up test applicant and student data safely
    try {
      const testUser = await db.user.findUnique({ where: { email: testEmail } });
      if (testUser) {
        const student = await db.student.findUnique({ where: { userId: testUser.id } });
        if (student) {
          const invoices = await db.invoice.findMany({ where: { studentId: student.id } });
          for (const inv of invoices) {
            await db.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
          }
          await db.invoice.deleteMany({ where: { studentId: student.id } });
          await db.studentStatusHistory.deleteMany({ where: { studentId: student.id } });
          await db.student.delete({ where: { id: student.id } });
        }
        if (createdApplicantId) {
          await db.applicationDocument.deleteMany({ where: { applicantId: createdApplicantId } });
          await db.applicant.deleteMany({ where: { id: createdApplicantId } });
        }
        await db.userRole.deleteMany({ where: { userId: testUser.id } });
        await db.user.delete({ where: { id: testUser.id } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
    await app.close();
  });

  // =========================================================================
  // 1. PUBLIC SELF-SERVICE APPLICATION SUBMISSION
  // =========================================================================
  describe('1. Public Applicant Submission', () => {
    it('should allow public applicant to submit application with documents', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admissions/apply')
        .send({
          firstName: 'Elena',
          lastName: 'Rostova',
          email: testEmail,
          phone: testPhone,
          programId: testProgramId,
          campusId: testCampusId,
          intakeTerm: 'FALL 2026',
          studyMode: 'REGULAR',
          nationality: 'Kenyan',
          documents: [
            {
              docType: 'TRANSCRIPT',
              title: 'KCSE National Result Slip',
              fileUrl: 'https://storage.chuoms.edu/documents/transcripts/elena-kcse.pdf',
              fileSize: 1048576,
              mimeType: 'application/pdf',
            },
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.applicationNumber).toMatch(/^APP-\d{4}-/);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.program.code).toBe('BCS');

      createdApplicantId = res.body.data.id;
      createdAppNumber = res.body.data.applicationNumber;
    });

    it('should reject duplicate application for the same email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admissions/apply')
        .send({
          firstName: 'Elena',
          lastName: 'Rostova',
          email: testEmail,
          programId: testProgramId,
          intakeTerm: 'FALL 2026',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('APPLICATION_ALREADY_EXISTS');
    });

    it('should allow public lookup by application number and email', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/admissions/lookup?applicationNumber=${createdAppNumber}&email=${encodeURIComponent(
            testEmail,
          )}`,
        )
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.applicationNumber).toBe(createdAppNumber);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.documents.length).toBe(1);
    });
  });

  // =========================================================================
  // 2. ADMISSIONS COMMITTEE EVALUATION & SCORING
  // =========================================================================
  describe('2. Committee Review, Scoring & Shortlisting', () => {
    it('should block unauthorized student role from reviewing applications', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admissions/applications/${createdApplicantId}/score`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ score: 95 })
        .expect(403);
    });

    it('should allow Admissions Officer / Registrar to score candidate and shortlist', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admissions/applications/${createdApplicantId}/score`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          score: 89.5,
          notes: 'Candidate has excellent STEM foundations. Strongly recommended.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(89.5);
      expect(res.body.data.status).toBe('SHORTLISTED');
    });

    it('should allow document verification by officer', async () => {
      // Fetch document
      const appDetail = await db.applicant.findUnique({
        where: { id: createdApplicantId },
        include: { documents: true },
      });
      const docId = appDetail!.documents[0].id;

      const res = await request(app.getHttpServer())
        .patch(
          `/api/v1/admissions/applications/${createdApplicantId}/documents/${docId}/verify`,
        )
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          isVerified: true,
          notes: 'Verified against KNEC exam database',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(true);
    });
  });

  // =========================================================================
  // 3. ADMISSION DECISION & OFFER LETTER GENERATION
  // =========================================================================
  describe('3. Decision & Offer Letter Issuance', () => {
    it('should issue formal admission offer with tamper-evident verification code', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admissions/applications/${createdApplicantId}/decision`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          decision: 'OFFERED',
          decisionReason: 'Admitted to Bachelor of Science in Computer Science for Fall 2026.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OFFERED');
      expect(res.body.data.verificationHash).toBeDefined();
      expect(res.body.data.offerLetterUrl).toContain(createdAppNumber);
    });

    it('should generate official verifiable offer letter document data', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admissions/offer-letter/${createdAppNumber}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.applicationNumber).toBe(createdAppNumber);
      expect(res.body.data.verificationCode).toBeDefined();
      expect(res.body.data.status).toBe('OFFERED');
    });

    it('should allow candidate to accept admission offer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admissions/applications/${createdApplicantId}/accept-offer`)
        .send({
          accepted: true,
          notes: 'Candidate accepts provisional offer.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
    });
  });

  // =========================================================================
  // 4. TRANSACTIONAL MATRICULATION ENGINE
  // =========================================================================
  describe('4. Transactional Student Matriculation', () => {
    it('should matriculate accepted candidate to enrolled active student with admission number', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admissions/applications/${createdApplicantId}/matriculate`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({
          cohortYear: 2026,
          currentLevel: 100,
          studyMode: 'REGULAR',
          notes: 'Approved for matriculation by Registrar Office.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.admissionNumber).toMatch(/^ADM-\d{4}-/);
      expect(res.body.data.studentId).toBeDefined();

      // Verify Database records
      const studentRecord = await db.student.findUnique({
        where: { id: res.body.data.studentId },
        include: { user: true, statusHistory: true },
      });

      expect(studentRecord).toBeDefined();
      expect(studentRecord!.admissionNumber).toBe(res.body.data.admissionNumber);
      expect(studentRecord!.user.admissionNumber).toBe(res.body.data.admissionNumber);
      expect(studentRecord!.statusHistory.length).toBeGreaterThanOrEqual(1);
      expect(studentRecord!.statusHistory[0].fromStatus).toBe('APPLICANT');
      expect(studentRecord!.statusHistory[0].toStatus).toBe('ACTIVE');

      // Verify Applicant status is MATRICULATED
      const appRecord = await db.applicant.findUnique({
        where: { id: createdApplicantId },
      });
      expect(appRecord!.status).toBe('MATRICULATED');
    });

    it('should prevent double matriculation of already matriculated applicant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admissions/applications/${createdApplicantId}/matriculate`)
        .set('Authorization', `Bearer ${registrarToken}`)
        .send({ cohortYear: 2026 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 5. ADMISSIONS FUNNEL METRICS
  // =========================================================================
  describe('5. Admissions Funnel Metrics', () => {
    it('should return aggregated admissions KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admissions/metrics')
        .set('Authorization', `Bearer ${registrarToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBeGreaterThanOrEqual(2);
      expect(res.body.data.matriculated).toBeGreaterThanOrEqual(1);
    });
  });
});
