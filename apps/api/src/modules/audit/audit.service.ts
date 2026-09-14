import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateAuditLogParams {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  reason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Append-only immutable audit logging.
   */
  async log(params: CreateAuditLogParams) {
    try {
      return await this.db.auditLog.create({
        data: {
          userId: params.userId || null,
          userEmail: params.userEmail || null,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          oldValues: params.oldValues || undefined,
          newValues: params.newValues || undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          reason: params.reason || null,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log:', err);
      return null;
    }
  }

  /**
   * Query tamper-evident audit logs with pagination and filters.
   */
  async getAuditLogs(options: {
    page?: number;
    limit?: number;
    resource?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.resource) where.resource = options.resource;
    if (options.action) where.action = options.action;
    if (options.userId) where.userId = options.userId;
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [items, totalRecords] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      items,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
