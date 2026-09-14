import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@edutech/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) || `req_${randomUUID()}`;

    return next.handle().pipe(
      map((result) => {
        // If result already contains paginated items + meta
        if (
          result &&
          typeof result === 'object' &&
          'items' in result &&
          'meta' in result
        ) {
          return {
            success: true,
            data: result.items,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
              pagination: result.meta,
            },
          };
        }

        return {
          success: true,
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}
