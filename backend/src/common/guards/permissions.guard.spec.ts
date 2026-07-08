import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { EmployeeAuth } from '../auth/employee-auth.factory';
import { PermissionsGuard } from './permissions.guard';

function createContext(employeeSession: { user: { id: string } }): {
  context: ExecutionContext;
  getHandler: () => unknown;
} {
  const handler = () => undefined;
  const request = { employeeSession };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
  } as unknown as ExecutionContext;
  return { context, getHandler: () => handler };
}

describe('PermissionsGuard', () => {
  it('allows access when no @RequirePermissions metadata is present', async () => {
    const reflector = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const userHasPermission = jest.fn();
    const employeeAuth = {
      api: { userHasPermission },
    } as unknown as EmployeeAuth;
    const guard = new PermissionsGuard(reflector, employeeAuth);

    const { context } = createContext({ user: { id: 'employee-1' } });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(userHasPermission).not.toHaveBeenCalled();
  });

  it('allows access when the permission check succeeds', async () => {
    const required = { user: ['create'] };
    const reflector = {
      get: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    const userHasPermission = jest.fn().mockResolvedValue({ success: true });
    const employeeAuth = {
      api: { userHasPermission },
    } as unknown as EmployeeAuth;
    const guard = new PermissionsGuard(reflector, employeeAuth);

    const { context } = createContext({ user: { id: 'employee-1' } });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(userHasPermission).toHaveBeenCalledWith({
      body: {
        userId: 'employee-1',
        permissions: required,
      },
    });
  });

  it('throws ForbiddenException when the permission check fails', async () => {
    const required = { user: ['delete'] };
    const reflector = {
      get: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    const userHasPermission = jest.fn().mockResolvedValue({ success: false });
    const employeeAuth = {
      api: { userHasPermission },
    } as unknown as EmployeeAuth;
    const guard = new PermissionsGuard(reflector, employeeAuth);

    const { context } = createContext({ user: { id: 'employee-1' } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
