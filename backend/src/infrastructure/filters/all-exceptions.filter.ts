import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '@/infrastructure/logging/logger';

/**
 * Global exception filter that catches all unhandled exceptions.
 * Ensures no stack traces or internal error details are leaked to the client.
 * All unexpected errors are logged server-side with full context.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const isClientError = status >= 400 && status < 500;

    if (!isClientError) {
      logger.error('Unhandled exception caught by AllExceptionsFilter', {
        method: req.method,
        url: req.url,
        status,
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    const message = isHttpException
      ? (exception.getResponse() as Record<string, unknown>)
      : { statusCode: status, message: 'Internal server error' };

    res.status(status).send(message);
  }
}
