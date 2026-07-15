import { randomUUID } from 'crypto';
import { APIError } from 'better-auth';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { createCustomerAuth } from './customer-auth.factory';
import type { CustomerAuth } from './customer-auth.factory';

const TEST_PASSWORD = 'correct-horse-battery-staple';

describe('createCustomerAuth — ban enforcement (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let customerAuth: CustomerAuth;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    customerAuth = createCustomerAuth({
      secret: appConfig.betterAuthCustomerSecret,
      baseUrl: appConfig.betterAuthUrl,
      prisma,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function signUp(email: string) {
    const result = await customerAuth.api.signUpEmail({
      body: { name: 'Test Customer', email, password: TEST_PASSWORD },
    });
    seededAccountIds.push(result.user.id);
    return result.user.id;
  }

  it('allows sign-in for a non-banned account', async () => {
    const email = `factory-ok-${randomUUID()}@example.com`;
    await signUp(email);

    await expect(
      customerAuth.api.signInEmail({
        body: { email, password: TEST_PASSWORD },
      }),
    ).resolves.toMatchObject({ user: { email } });
  });

  it('rejects sign-in for a permanently banned account', async () => {
    const email = `factory-banned-${randomUUID()}@example.com`;
    const userId = await signUp(email);
    await prisma.customerAccount.update({
      where: { id: userId },
      data: { banned: true, banReason: 'test ban' },
    });

    await expect(
      customerAuth.api.signInEmail({
        body: { email, password: TEST_PASSWORD },
      }),
    ).rejects.toThrow(APIError);
  });

  it('rejects sign-in while banExpires is still in the future', async () => {
    const email = `factory-banned-future-${randomUUID()}@example.com`;
    const userId = await signUp(email);
    await prisma.customerAccount.update({
      where: { id: userId },
      data: {
        banned: true,
        banExpires: new Date(Date.now() + 60_000),
      },
    });

    await expect(
      customerAuth.api.signInEmail({
        body: { email, password: TEST_PASSWORD },
      }),
    ).rejects.toThrow(APIError);
  });

  it('auto-clears an expired ban and allows sign-in', async () => {
    const email = `factory-banned-expired-${randomUUID()}@example.com`;
    const userId = await signUp(email);
    await prisma.customerAccount.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: 'expired ban',
        banExpires: new Date(Date.now() - 60_000),
      },
    });

    await expect(
      customerAuth.api.signInEmail({
        body: { email, password: TEST_PASSWORD },
      }),
    ).resolves.toMatchObject({ user: { email } });

    const account = await prisma.customerAccount.findUniqueOrThrow({
      where: { id: userId },
    });
    expect(account.banned).toBe(false);
    expect(account.banReason).toBeNull();
    expect(account.banExpires).toBeNull();
  });

  it('logs out an existing session when its rows are deleted (simulating a ban)', async () => {
    const email = `factory-kill-session-${randomUUID()}@example.com`;
    const userId = await signUp(email);

    const signInResult = await customerAuth.api.signInEmail({
      body: { email, password: TEST_PASSWORD },
      asResponse: true,
    });
    const setCookie = signInResult.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();

    await prisma.customerSession.deleteMany({ where: { userId } });

    const session = await customerAuth.api.getSession({
      headers: new Headers({ cookie: setCookie ?? '' }),
    });
    expect(session).toBeNull();
  });
});
