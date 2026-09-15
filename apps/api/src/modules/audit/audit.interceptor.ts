import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AUDIT_KEY, AuditMetadata } from '../../common/decorators/audit.decorator';
import { Request } from 'express';
import { JwtPayload } from '@chuoms/common';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMeta = this.reflector.getAllAndOverride<AuditMetadata>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload | undefined;
    const ipAddress = request.ip || request.socket.remoteAddress || '127.0.0.1';
    const userAgent = request.headers['user-agent'] || 'Unknown';

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (!auditMeta) return;

        const resourceId = auditMeta.extractResourceId
          ? auditMeta.extractResourceId(request, responseBody)
          : responseBody?.id || responseBody?.data?.id || request.params?.id || 'N/A';

        await this.auditService.log({
          userId: user?.sub,
          userEmail: user?.email,
          action: auditMeta.action,
          resource: auditMeta.resource,
          resourceId: String(resourceId),
          oldValues: undefined,
          newValues: request.body || undefined,
          ipAddress,
          userAgent,
          reason: (request.headers['x-audit-reason'] as string) || undefined,
        });
      }),
    );
  }
}
