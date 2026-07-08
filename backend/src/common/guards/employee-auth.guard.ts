import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import type {
  EmployeeAuth,
  EmployeeSession,
} from '../auth/employee-auth.factory';
import { EMPLOYEE_AUTH } from '../auth/auth.constants';
import { BaseAuthGuard } from './base-auth.guard';

export interface EmployeeAuthenticatedRequest extends Request {
  employeeSession: EmployeeSession;
}

@Injectable()
export class EmployeeAuthGuard extends BaseAuthGuard<EmployeeSession> {
  constructor(
    @Inject(EMPLOYEE_AUTH) private readonly employeeAuth: EmployeeAuth,
  ) {
    super();
  }

  protected fetchSession(headers: Headers): Promise<EmployeeSession | null> {
    return this.employeeAuth.api.getSession({ headers });
  }

  protected attachSession(request: Request, session: EmployeeSession): void {
    (request as EmployeeAuthenticatedRequest).employeeSession = session;
  }
}
