import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { EMPLOYEE_ROLE } from '../constants/roles.constants';
import { createEmployeeAuth, EmployeeAuth } from './employee-auth.factory';

describe('Employee role hierarchy (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaClient;
  let auth: EmployeeAuth;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.TEST_DATABASE_URL,
      }),
    });
    auth = createEmployeeAuth({
      secret: 'a'.repeat(32),
      baseUrl: 'http://localhost:3000',
      prisma,
      otpSender: { send: () => Promise.resolve() },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedAccount(role: string): Promise<string> {
    const account = await prisma.employeeAccount.create({
      data: {
        name: `Test ${role}`,
        email: `role-hierarchy-${role}-${Date.now()}@example.com`,
        emailVerified: true,
        role,
      },
    });
    seededAccountIds.push(account.id);
    return account.id;
  }

  it('employee is allowed user.get but denied user.create', async () => {
    const userId = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);

    const allowed = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['get'] } },
    });
    expect(allowed.success).toBe(true);

    const denied = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['create'] } },
    });
    expect(denied.success).toBe(false);
  });

  it('admin is allowed user.create and user.delete but denied set-role and impersonate', async () => {
    const userId = await seedAccount(EMPLOYEE_ROLE.ADMIN);

    const allowedCreate = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['create'] } },
    });
    expect(allowedCreate.success).toBe(true);

    const allowedDelete = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['delete'] } },
    });
    expect(allowedDelete.success).toBe(true);

    const deniedSetRole = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['set-role'] } },
    });
    expect(deniedSetRole.success).toBe(false);

    const deniedImpersonate = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['impersonate'] } },
    });
    expect(deniedImpersonate.success).toBe(false);
  });

  it('super_admin is allowed user.delete, set-role, and impersonate', async () => {
    const userId = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);

    const allowedDelete = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['delete'] } },
    });
    expect(allowedDelete.success).toBe(true);

    const allowedSetRole = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['set-role'] } },
    });
    expect(allowedSetRole.success).toBe(true);

    const allowedImpersonate = await auth.api.userHasPermission({
      body: { userId, permissions: { user: ['impersonate'] } },
    });
    expect(allowedImpersonate.success).toBe(true);
  });
});
