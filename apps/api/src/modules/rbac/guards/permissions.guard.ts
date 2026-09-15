import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../../../common/decorators/permissions.decorator';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload, SystemRole } from '@chuoms/common';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user }: { user: JwtPayload } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Super Admin has global override capability
    if (user.roles.includes(SystemRole.SUPER_ADMIN)) {
      return true;
    }

    // Query active permissions for the user's assigned roles
    const userRoleEntities = await this.db.userRole.findMany({
      where: { userId: user.sub },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const userPermissions = new Set<string>();
    for (const ur of userRoleEntities) {
      for (const rp of ur.role.rolePermissions) {
        userPermissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }

    // Verify all required permissions are satisfied
    for (const reqPerm of requiredPermissions) {
      const permKey = `${reqPerm.resource}:${reqPerm.action}`;
      if (!userPermissions.has(permKey)) {
        throw new ForbiddenException({
          code: 'PERMISSION_DENIED',
          message: `Action requires permission: ${reqPerm.action} on ${reqPerm.resource}.`,
        });
      }
    }

    return true;
  }
}
