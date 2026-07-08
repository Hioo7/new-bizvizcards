import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EMPLOYEE_AUTH } from '../auth/auth.constants';
import type { EmployeeAuth } from '../auth/employee-auth.factory';
import {
  PermissionRequirement,
  REQUIRE_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';
import { EmployeeAuthenticatedRequest } from './employee-auth.guard';

// Runs after EmployeeAuthGuard (@UseGuards(EmployeeAuthGuard, PermissionsGuard)),
// which authenticates and attaches request.employeeSession — a missing
// session here would mean the guards were applied out of order or this guard
// was used without EmployeeAuthGuard.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(EMPLOYEE_AUTH) private readonly employeeAuth: EmployeeAuth,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<PermissionRequirement | undefined>(
      REQUIRE_PERMISSIONS_KEY,
      context.getHandler(),
    );
    if (!required) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<EmployeeAuthenticatedRequest>();

    const { success } = await this.employeeAuth.api.userHasPermission({
      body: {
        userId: request.employeeSession.user.id,
        permissions: required,
      },
    });

    if (!success) {
      throw new ForbiddenException();
    }

    return true;
  }
}
