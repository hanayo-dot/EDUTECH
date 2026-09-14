import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  controllers: [RbacController],
  providers: [RbacService, JwtAuthGuard, RolesGuard, PermissionsGuard],
  exports: [RbacService, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class RbacModule {}
