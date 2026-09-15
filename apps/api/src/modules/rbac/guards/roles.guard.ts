import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { JwtPayload, SystemRole } from '@chuoms/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(SystemRole | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user }: { user: JwtPayload } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      throw new ForbiddenException({
        code: 'ACCESS_DENIED',
        message: 'You lack the required role permissions to perform this action.',
      });
    }

    // Super Admin has global override capability
    if (user.roles.includes(SystemRole.SUPER_ADMIN)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message: `Requires one of roles: [${requiredRoles.join(', ')}].`,
      });
    }

    return true;
  }
}
