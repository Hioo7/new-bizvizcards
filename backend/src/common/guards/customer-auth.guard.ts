import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import type {
  CustomerAuth,
  CustomerSession,
} from '../auth/customer-auth.factory';
import { CUSTOMER_AUTH } from '../auth/auth.constants';
import { BaseAuthGuard } from './base-auth.guard';

export interface CustomerAuthenticatedRequest extends Request {
  customerSession: CustomerSession;
}

@Injectable()
export class CustomerAuthGuard extends BaseAuthGuard<CustomerSession> {
  constructor(
    @Inject(CUSTOMER_AUTH) private readonly customerAuth: CustomerAuth,
  ) {
    super();
  }

  protected fetchSession(headers: Headers): Promise<CustomerSession | null> {
    return this.customerAuth.api.getSession({ headers });
  }

  protected attachSession(request: Request, session: CustomerSession): void {
    (request as CustomerAuthenticatedRequest).customerSession = session;
  }
}
