import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type {
  EmployeeAuth,
  EmployeeSession,
} from '../auth/employee-auth.factory';
import { EmployeeAuthGuard } from './employee-auth.guard';

function createContext(headers: Record<string, string>): ExecutionContext {
  const request = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('EmployeeAuthGuard', () => {
  it('attaches the session and allows access when a valid session exists', async () => {
    const session = {
      user: { id: 'employee-1' },
    } as unknown as EmployeeSession;
    const getSession = jest.fn().mockResolvedValue(session);
    const employeeAuth = { api: { getSession } } as unknown as EmployeeAuth;
    const guard = new EmployeeAuthGuard(employeeAuth);

    const context = createContext({ cookie: 'token=abc' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(getSession).toHaveBeenCalledTimes(1);
    const request = context
      .switchToHttp()
      .getRequest<{ employeeSession: unknown }>();
    expect(request.employeeSession).toBe(session);
  });

  it('throws UnauthorizedException when there is no session', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const employeeAuth = { api: { getSession } } as unknown as EmployeeAuth;
    const guard = new EmployeeAuthGuard(employeeAuth);

    const context = createContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
