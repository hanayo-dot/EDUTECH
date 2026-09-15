import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@chuoms/common';
import { RedisService } from '../../redis/redis.service';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly redisService: RedisService,
    private readonly db: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.['accessToken'] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ||
        'CHANGE_ME_IN_PRODUCTION_SUPER_SECRET_JWT_ACCESS_KEY_2026',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // 1. Check if session has been revoked in Redis blacklist
    const isRevoked = await this.redisService.isSessionRevoked(payload.sessionId);
    if (isRevoked) {
      throw new UnauthorizedException({
        code: 'SESSION_REVOKED',
        message: 'Your session has been terminated. Please log in again.',
      });
    }

    // 2. Verify user is still active and unlocked in DB
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: { isActive: true, isLocked: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.isLocked || user.deletedAt) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'Account is deactivated, locked, or no longer exists.',
      });
    }

    return payload;
  }
}
