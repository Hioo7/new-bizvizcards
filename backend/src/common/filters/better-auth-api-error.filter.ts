import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { APIError } from 'better-auth';
import { Response } from 'express';

@Catch(APIError)
export class BetterAuthApiErrorFilter implements ExceptionFilter {
  catch(exception: APIError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.statusCode ?? 500).json({
      message: exception.body?.message ?? 'Request failed',
      code: exception.body?.code,
    });
  }
}
