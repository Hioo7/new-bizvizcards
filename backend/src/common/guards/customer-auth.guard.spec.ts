import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type {
  CustomerAuth,
  CustomerSession,
} from '../auth/customer-auth.factory';
import { CustomerAuthGuard } from './customer-auth.guard';

function createContext(headers: Record<string, string>): ExecutionContext {
  const request = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('CustomerAuthGuard', () => {
  it('attaches the session and allows access when a valid session exists', async () => {
    const session = {
      user: { id: 'customer-1' },
    } as unknown as CustomerSession;
    const getSession = jest.fn().mockResolvedValue(session);
    const customerAuth = { api: { getSession } } as unknown as CustomerAuth;
    const guard = new CustomerAuthGuard(customerAuth);

    const context = createContext({ cookie: 'token=abc' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(getSession).toHaveBeenCalledTimes(1);
    const request = context
      .switchToHttp()
      .getRequest<{ customerSession: unknown }>();
    expect(request.customerSession).toBe(session);
  });

  it('throws UnauthorizedException when there is no session', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const customerAuth = { api: { getSession } } as unknown as CustomerAuth;
    const guard = new CustomerAuthGuard(customerAuth);

    const context = createContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
