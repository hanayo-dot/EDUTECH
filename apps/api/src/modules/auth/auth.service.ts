import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { JwtPayload, ScopeType, SystemRole } from '@edutech/common';
import { randomUUID, createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Multi-identifier login supporting Email, Username, Admission Number, or Staff Number.
   */
  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.db.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier.toLowerCase() },
          { username: dto.identifier.toLowerCase() },
          { admissionNumber: dto.identifier.toUpperCase() },
          { staffNumber: dto.identifier.toUpperCase() },
        ],
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: { role: true },
        },
        studentProfile: true,
        staffProfile: true,
        applicantProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials provided.',
      });
    }

    // 1. Account Lockout Verification
    if (user.isLocked) {
      if (user.lockoutExpiresAt && user.lockoutExpiresAt > new Date()) {
        const remainingMinutes = Math.ceil(
          (user.lockoutExpiresAt.getTime() - Date.now()) / 60000,
        );
        throw new ForbiddenException({
          code: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to excessive failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        });
      } else {
        // Lockout expired, reset counters
        await this.db.user.update({
          where: { id: user.id },
          data: { isLocked: false, failedLoginCount: 0, lockoutExpiresAt: null },
        });
      }
    }

    // 2. Password Verification with Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      const newFailedCount = user.failedLoginCount + 1;
      const willLock = newFailedCount >= 5;

      await this.db.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          isLocked: willLock,
          lockoutExpiresAt: willLock
            ? new Date(Date.now() + 15 * 60 * 1000) // 15-minute lockout
            : null,
        },
      });

      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: willLock
          ? 'Account locked due to 5 consecutive failed login attempts.'
          : 'Invalid credentials provided.',
      });
    }

    // 3. Multi-Factor Authentication (MFA) Check
    if (user.isMfaEnabled && user.mfaSecret) {
      if (!dto.totpCode) {
        return {
          requiresMfa: true,
          userId: user.id,
          message: 'Two-factor authentication code required.',
        };
      }

      const isMfaValid = authenticator.check(dto.totpCode, user.mfaSecret);
      if (!isMfaValid) {
        throw new UnauthorizedException({
          code: 'INVALID_MFA_TOKEN',
          message: 'Invalid two-factor authentication token.',
        });
      }
    }

    // 4. Reset Failed Logins & Record Login Timestamp
    await this.db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        isLocked: false,
        lockoutExpiresAt: null,
        lastLoginAt: new Date(),
      },
    });

    // 5. Generate Session & Tokens
    const sessionId = randomUUID();
    const refreshToken = randomUUID();
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        ipAddress,
        userAgent,
        refreshTokenHash,
        expiresAt,
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.code as SystemRole);
    const scopes = user.userRoles.map((ur) => ({
      scopeType: ur.scopeType as ScopeType,
      scopeId: ur.scopeId || undefined,
    }));

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles,
      scopes,
      sessionId,
      studentId: user.studentProfile?.id,
      staffId: user.staffProfile?.id,
      applicantId: user.applicantProfile?.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_ACCESS_SECRET ||
        'CHANGE_ME_IN_PRODUCTION_SUPER_SECRET_JWT_ACCESS_KEY_2026',
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });

    return {
      requiresMfa: false,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        scopes,
        studentId: user.studentProfile?.id,
        staffId: user.staffProfile?.id,
      },
    };
  }

  /**
   * Terminate active device session.
   */
  async logout(sessionId: string, userId: string) {
    await this.db.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });

    await this.redisService.revokeSession(sessionId);
    return { message: 'Successfully logged out.' };
  }

  /**
   * Revoke all active sessions for user across all devices.
   */
  async revokeAllSessions(userId: string) {
    const activeSessions = await this.db.userSession.findMany({
      where: { userId, revokedAt: null },
    });

    for (const session of activeSessions) {
      await this.redisService.revokeSession(session.id);
    }

    await this.db.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: `Revoked ${activeSessions.length} active session(s).` };
  }

  /**
   * List active sessions for user.
   */
  async listSessions(userId: string) {
    return this.db.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Setup TOTP Two-Factor Authentication.
   */
  async setupMfa(userId: string) {
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      user.email,
      'EduTech Institutional CMS',
      secret,
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Temporarily save secret until verified
    await this.redisService.set(`mfa_setup:${userId}`, secret, 600); // 10 minutes

    return {
      secret,
      qrCodeDataUrl,
    };
  }

  /**
   * Verify and activate MFA.
   */
  async verifyAndEnableMfa(userId: string, token: string) {
    const secret = await this.redisService.get(`mfa_setup:${userId}`);
    if (!secret) {
      throw new BadRequestException({
        code: 'MFA_SETUP_EXPIRED',
        message: 'MFA setup session has expired. Please initiate setup again.',
      });
    }

    const isValid = authenticator.check(token, secret);
    if (!isValid) {
      throw new BadRequestException({
        code: 'INVALID_MFA_TOKEN',
        message: 'Invalid TOTP token. Please check your authenticator app.',
      });
    }

    await this.db.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        isMfaEnabled: true,
      },
    });

    await this.redisService.del(`mfa_setup:${userId}`);
    return { message: 'Two-factor authentication successfully activated.' };
  }
}
