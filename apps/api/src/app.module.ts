import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { AcademicTermsModule } from './modules/academic-terms/academic-terms.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 300, // 300 requests per minute
      },
    ]),
    DatabaseModule,
    RedisModule,
    RbacModule,
    AuthModule,
    AuditModule,
    OrganizationModule,
    AcademicTermsModule,
    CurriculumModule,
    AdmissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
