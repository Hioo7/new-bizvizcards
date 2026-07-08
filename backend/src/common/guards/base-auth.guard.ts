import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export function headersFromExpressRequest(
  headers: Request['headers'],
): Headers {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, item);
      }
    } else {
      result.append(key, value);
    }
  }
  return result;
}

export abstract class BaseAuthGuard<TSession> implements CanActivate {
  protected abstract fetchSession(headers: Headers): Promise<TSession | null>;
  protected abstract attachSession(request: Request, session: TSession): void;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.fetchSession(
      headersFromExpressRequest(request.headers),
    );

    if (!session) {
      throw new UnauthorizedException();
    }

    this.attachSession(request, session);
    return true;
  }
}
