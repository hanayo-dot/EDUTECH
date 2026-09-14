import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@edutech/common';

export interface RequiredPermission {
  resource: PermissionResource | string;
  action: PermissionAction | string;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (
  resource: PermissionResource | string,
  action: PermissionAction | string,
) => SetMetadata(PERMISSIONS_KEY, [{ resource, action }]);

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
