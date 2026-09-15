import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform.interceptor';
import { DatabaseService } from '../src/modules/database/database.service';

describe('Auth, RBAC & Audit E2E Integration Suite', () => {
  let app: INestApplication;
  let db: DatabaseService;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Multi-Identifier Authentication', () => {
    it('should authenticate Super Admin using email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@chuoms.edu',
          password: 'Password@2026!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.roles).toContain('SUPER_ADMIN');
    });

    it('should authenticate Student using Admission Number', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'ADM-2026-0001',
          password: 'Password@2026!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('alice.johnson');
      expect(res.body.data.user.roles).toContain('STUDENT');
    });

    it('should authenticate Staff using Staff Number', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'STF-REG-001',
          password: 'Password@2026!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('registrar');
      expect(res.body.data.user.roles).toContain('REGISTRAR');
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@chuoms.edu',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('2. Account Lockout Protection', () => {
    it('should lock account after 5 consecutive failed login attempts', async () => {
      const targetUser = 'bob.miller@student.chuoms.edu';

      // Reset Bob first to ensure clean state
      await db.user.update({
        where: { email: targetUser },
        data: { failedLoginCount: 0, isLocked: false, lockoutExpiresAt: null },
      });

      // 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ identifier: targetUser, password: 'BadPassword!' })
          .expect(401);
      }

      // 5th failed attempt: triggers account lockout
      const fifthRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: targetUser, password: 'BadPassword!' })
        .expect(401);

      expect(fifthRes.body.error.message).toContain('Account locked');

      // 6th attempt: immediately rejected with 403 Account Locked
      const sixthRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: targetUser, password: 'Password@2026!' })
        .expect(403);

      expect(sixthRes.body.error.code).toBe('ACCOUNT_LOCKED');

      // Cleanup: Unlock Bob for subsequent tests
      await db.user.update({
        where: { email: targetUser },
        data: { failedLoginCount: 0, isLocked: false, lockoutExpiresAt: null },
      });
    });
  });

  describe('3. Granular RBAC & Route Authorization', () => {
    let studentToken: string;
    let adminToken: string;

    beforeAll(async () => {
      const studentRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: 'alice.johnson@student.chuoms.edu', password: 'Password@2026!' });
      studentToken = studentRes.body.data.accessToken;

      const adminRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: 'admin@chuoms.edu', password: 'Password@2026!' });
      adminToken = adminRes.body.data.accessToken;
    });

    it('should forbid Student from accessing /api/v1/rbac/roles (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/rbac/roles')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_ROLE');
    });

    it('should permit Super Admin to access /api/v1/rbac/roles (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(28);
    });
  });

  describe('4. Session Management & Redis Blacklist Revocation', () => {
    it('should allow user to view active sessions and revoke current session', async () => {
      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: 'admin@chuoms.edu', password: 'Password@2026!' })
        .expect(200);

      const token = loginRes.body.data.accessToken;

      // Check sessions list
      const sessionsRes = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionsRes.body.success).toBe(true);
      expect(sessionsRes.body.data.length).toBeGreaterThanOrEqual(1);

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Attempting request with now-revoked token should return 401 SESSION_REVOKED
      const revokedRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(revokedRes.body.error.code).toBe('SESSION_REVOKED');
    });
  });
});
