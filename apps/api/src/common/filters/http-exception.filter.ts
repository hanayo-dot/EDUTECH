import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ApiFieldError } from '@edutech/common';
import { randomUUID } from 'crypto';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || `req_${randomUUID()}`;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal error occurred. Please contact system support.';
    let details: ApiFieldError[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        errorCode = resObj.code || resObj.error || this.getErrorCodeFromStatus(status);

        if (Array.isArray(resObj.message)) {
          // Class-validator validation errors
          message = 'Validation failed for one or more fields.';
          errorCode = 'VALIDATION_ERROR';
          details = resObj.message.map((msg: string) => {
            const parts = msg.split(' ');
            return {
              field: parts[0] || 'field',
              issue: msg,
            };
          });
        }
      }
    } else {
      this.logger.error(
        `Unhandled Exception on [${request.method}] ${request.url} (Request ID: ${requestId}):`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    response.status(status).json(errorPayload);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
