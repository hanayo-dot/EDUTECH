import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '@edutech/common';

class CreateRoleDto {
  code!: string;
  name!: string;
  description?: string;
}

class CloneRoleDto {
  newCode!: string;
  newName!: string;
}

class AssignPermissionsDto {
  permissionIds!: string[];
}

class AssignUserRoleDto {
  roleId!: string;
  scopeType?: string;
  scopeId?: string;
}

@ApiTags('RBAC & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.SUPER_ADMIN, SystemRole.INSTITUTION_ADMIN)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List all system and institutional roles' })
  async listRoles() {
    return this.rbacService.listRoles();
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new institutional custom role' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto.code, dto.name, dto.description);
  }

  @Post('roles/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone an existing role with all its permissions' })
  async cloneRole(@Param('id') roleId: string, @Body() dto: CloneRoleDto) {
    return this.rbacService.cloneRole(roleId, dto.newCode, dto.newName);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available granular system permissions' })
  async listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Assign granular permissions to a role' })
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rbacService.assignPermissionsToRole(roleId, dto.permissionIds);
  }

  @Post('users/:userId/assign-role')
  @ApiOperation({ summary: 'Assign a scoped role to a user' })
  async assignUserRole(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
  ) {
    return this.rbacService.assignRoleToUser(
      userId,
      dto.roleId,
      dto.scopeType,
      dto.scopeId,
    );
  }
}
