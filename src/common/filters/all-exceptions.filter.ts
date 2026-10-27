import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Filtro global de excepciones. Formato de error uniforme:
 * { success: false, statusCode, message, path, timestamp }
 *
 * - HttpException (validación, auth, roles, 404, conflictos) => su propio status.
 * - Errores de PostgreSQL (QueryFailedError) se traducen a 4xx en vez de 500.
 * - Solo los errores realmente inesperados devuelven 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string' ? body : ((body as any).message ?? exception.message);
    } else if (exception instanceof QueryFailedError) {
      const mapped = this.mapDatabaseError(exception);
      statusCode = mapped.statusCode;
      message = mapped.message;
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }

  /** Traduce códigos de error de PostgreSQL a respuestas HTTP apropiadas. */
  private mapDatabaseError(error: QueryFailedError) {
    const code = (error as any).driverError?.code;
    const detail: string = (error as any).driverError?.detail ?? '';

    switch (code) {
      case '23505': // unique_violation
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Ya existe un registro con esos datos. ${detail}`.trim(),
        };
      case '23503': // foreign_key_violation
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Operación no permitida: existen registros relacionados.',
        };
      case '23502': // not_null_violation
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Faltan campos obligatorios.' };
      case '22P02': // invalid_text_representation (ej. enum o id inválido)
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Valor con formato inválido.' };
      default:
        this.logger.error(error.message);
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor',
        };
    }
  }
}