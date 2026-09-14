import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RbacService {
  constructor(private readonly db: DatabaseService) {}

  async listRoles() {
    return this.db.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRoleById(roleId: string) {
    const role = await this.db.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    return role;
  }

  async createRole(code: string, name: string, description?: string) {
    const existing = await this.db.role.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Role with code '${code}' already exists.`);
    }

    return this.db.role.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        isSystemRole: false,
      },
    });
  }

  async cloneRole(sourceRoleId: string, newCode: string, newName: string) {
    const sourceRole = await this.getRoleById(sourceRoleId);

    const existing = await this.db.role.findUnique({ where: { code: newCode } });
    if (existing) {
      throw new BadRequestException(`Role with code '${newCode}' already exists.`);
    }

    const clonedRole = await this.db.role.create({
      data: {
        code: newCode.toUpperCase(),
        name: newName,
        description: `Cloned from ${sourceRole.name}`,
        isSystemRole: false,
      },
    });

    // Copy permissions from source role
    if (sourceRole.rolePermissions.length > 0) {
      await this.db.rolePermission.createMany({
        data: sourceRole.rolePermissions.map((rp) => ({
          roleId: clonedRole.id,
          permissionId: rp.permissionId,
        })),
      });
    }

    return this.getRoleById(clonedRole.id);
  }

  async listPermissions() {
    return this.db.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    await this.getRoleById(roleId);

    // Delete existing and replace with new set
    await this.db.rolePermission.deleteMany({ where: { roleId } });

    await this.db.rolePermission.createMany({
      data: permissionIds.map((pid) => ({
        roleId,
        permissionId: pid,
      })),
      skipDuplicates: true,
    });

    return this.getRoleById(roleId);
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    scopeType = 'GLOBAL',
    scopeId?: string,
  ) {
    return this.db.userRole.upsert({
      where: {
        userId_roleId_scopeType_scopeId: {
          userId,
          roleId,
          scopeType,
          scopeId: scopeId || '',
        },
      },
      update: {},
      create: {
        userId,
        roleId,
        scopeType,
        scopeId: scopeId || null,
      },
    });
  }
}
