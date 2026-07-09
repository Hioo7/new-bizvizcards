import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EMPLOYEE_ROLE } from '../../../common/constants/roles.constants';
import type {
  OtpSendParams,
  OtpSender,
} from '../../../common/auth/otp-sender/otp-sender.interface';
import { createEmployeeAuth } from '../../../common/auth/employee-auth.factory';
import type { EmployeeAuth } from '../../../common/auth/employee-auth.factory';
import { StaffService } from './staff.service';

class FakeOtpSender implements OtpSender {
  private lastOtpByEmail = new Map<string, string>();

  send(params: OtpSendParams): Promise<void> {
    this.lastOtpByEmail.set(params.email, params.otp);
    return Promise.resolve();
  }

  otpFor(email: string): string {
    const otp = this.lastOtpByEmail.get(email);
    if (!otp) throw new Error(`No OTP captured for ${email}`);
    return otp;
  }
}

// The sign-in response sets its session via Set-Cookie headers; turn those
// into a Cookie request header so subsequent authenticated calls can reuse
// the session, mirroring what a browser would send back.
function cookieHeaderFromResponse(response: Response): Headers {
  const cookiePairs = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0]);
  return new Headers({ cookie: cookiePairs.join('; ') });
}

describe('StaffService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let otpSender: FakeOtpSender;
  let auth: EmployeeAuth;
  let service: StaffService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    otpSender = new FakeOtpSender();
    auth = createEmployeeAuth({
      secret: 'a'.repeat(32),
      baseUrl: 'http://localhost:3000',
      prisma,
      otpSender,
    });
    service = new StaffService(prisma, auth);
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedAccount(role: string, namePrefix = role) {
    const account = await prisma.employeeAccount.create({
      data: {
        name: `${namePrefix} ${randomUUID().slice(0, 8)}`,
        email: `staff-service-${randomUUID()}@example.com`,
        emailVerified: true,
        role,
      },
    });
    seededAccountIds.push(account.id);
    return account;
  }

  async function signInHeaders(email: string): Promise<Headers> {
    await auth.api.sendVerificationOTP({ body: { email, type: 'sign-in' } });
    const otp = otpSender.otpFor(email);
    const response = await auth.api.signInEmailOTP({
      body: { email, otp },
      asResponse: true,
    });
    return cookieHeaderFromResponse(response);
  }

  describe('list', () => {
    it('filters by role, searches by name/email, and paginates', async () => {
      const employeeA = await seedAccount(
        EMPLOYEE_ROLE.EMPLOYEE,
        'Alice Employee',
      );
      const employeeB = await seedAccount(
        EMPLOYEE_ROLE.EMPLOYEE,
        'Bob Employee',
      );
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN, 'Carol Admin');

      const byRole = await service.list({
        role: EMPLOYEE_ROLE.ADMIN,
        page: 1,
        pageSize: 20,
      });
      expect(byRole.staff.map((s) => s.id)).toEqual([admin.id]);

      const bySearch = await service.list({
        search: 'Alice',
        page: 1,
        pageSize: 20,
      });
      expect(bySearch.staff.map((s) => s.id)).toEqual([employeeA.id]);

      const byEmailSearch = await service.list({
        search: employeeB.email,
        page: 1,
        pageSize: 20,
      });
      expect(byEmailSearch.staff.map((s) => s.id)).toEqual([employeeB.id]);

      const paged = await service.list({
        role: EMPLOYEE_ROLE.EMPLOYEE,
        page: 1,
        pageSize: 1,
      });
      expect(paged.staff).toHaveLength(1);
      expect(paged.total).toBe(2);
      expect(paged.page).toBe(1);
      expect(paged.pageSize).toBe(1);
    });
  });

  describe('create', () => {
    it('super_admin can create an employee or an admin', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      const createdEmployee = await service.create(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        {
          email: `new-employee-${randomUUID()}@example.com`,
          name: 'New Employee',
          role: EMPLOYEE_ROLE.EMPLOYEE,
        },
      );
      seededAccountIds.push(createdEmployee.id);
      expect(createdEmployee.role).toBe(EMPLOYEE_ROLE.EMPLOYEE);

      const createdAdmin = await service.create(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        {
          email: `new-admin-${randomUUID()}@example.com`,
          name: 'New Admin',
          role: EMPLOYEE_ROLE.ADMIN,
        },
      );
      seededAccountIds.push(createdAdmin.id);
      expect(createdAdmin.role).toBe(EMPLOYEE_ROLE.ADMIN);
    });

    it("forces an admin actor's created staff to role=employee regardless of the requested role", async () => {
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const headers = await signInHeaders(admin.email);

      const created = await service.create(EMPLOYEE_ROLE.ADMIN, headers, {
        email: `admin-created-${randomUUID()}@example.com`,
        name: 'Admin Created',
        role: EMPLOYEE_ROLE.ADMIN,
      });
      seededAccountIds.push(created.id);

      expect(created.role).toBe(EMPLOYEE_ROLE.EMPLOYEE);
    });

    it('rejects creating a staff account with a duplicate email', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const existing = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const headers = await signInHeaders(superAdmin.email);

      await expect(
        service.create(EMPLOYEE_ROLE.SUPER_ADMIN, headers, {
          email: existing.email,
          name: 'Duplicate',
          role: EMPLOYEE_ROLE.EMPLOYEE,
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateName', () => {
    it('super_admin can rename an employee or an admin', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      const renamedEmployee = await service.updateName(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        employee.id,
        { name: 'Renamed Employee' },
      );
      expect(renamedEmployee.name).toBe('Renamed Employee');

      const renamedAdmin = await service.updateName(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        admin.id,
        { name: 'Renamed Admin' },
      );
      expect(renamedAdmin.name).toBe('Renamed Admin');
    });

    it('admin can rename an employee but not another admin or the super_admin', async () => {
      const actingAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const otherAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const headers = await signInHeaders(actingAdmin.email);

      const renamed = await service.updateName(
        EMPLOYEE_ROLE.ADMIN,
        headers,
        employee.id,
        {
          name: 'Renamed By Admin',
        },
      );
      expect(renamed.name).toBe('Renamed By Admin');

      await expect(
        service.updateName(EMPLOYEE_ROLE.ADMIN, headers, otherAdmin.id, {
          name: 'Nope',
        }),
      ).rejects.toThrow();

      await expect(
        service.updateName(EMPLOYEE_ROLE.ADMIN, headers, superAdmin.id, {
          name: 'Nope',
        }),
      ).rejects.toThrow();
    });

    it('nobody can rename the super_admin, including the super_admin itself', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      await expect(
        service.updateName(EMPLOYEE_ROLE.SUPER_ADMIN, headers, superAdmin.id, {
          name: 'Self Rename',
        }),
      ).rejects.toThrow();
    });
  });

  describe('setRole', () => {
    it('super_admin can promote an employee to admin and demote back', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const headers = await signInHeaders(superAdmin.email);

      const promoted = await service.setRole(
        superAdmin.id,
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        employee.id,
        { role: EMPLOYEE_ROLE.ADMIN },
      );
      expect(promoted.role).toBe(EMPLOYEE_ROLE.ADMIN);

      const demoted = await service.setRole(
        superAdmin.id,
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        employee.id,
        { role: EMPLOYEE_ROLE.EMPLOYEE },
      );
      expect(demoted.role).toBe(EMPLOYEE_ROLE.EMPLOYEE);
    });

    it('blocks a super_admin from changing their own role', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      await expect(
        service.setRole(
          superAdmin.id,
          EMPLOYEE_ROLE.SUPER_ADMIN,
          headers,
          superAdmin.id,
          {
            role: EMPLOYEE_ROLE.ADMIN,
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe('ban / unban', () => {
    it('super_admin can ban and unban an employee and an admin', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      const banned = await service.ban(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        employee.id,
        {
          banReason: 'test',
        },
      );
      expect(banned.banned).toBe(true);
      const unbanned = await service.unban(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        employee.id,
      );
      expect(unbanned.banned).toBe(false);

      const bannedAdmin = await service.ban(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        admin.id,
        {},
      );
      expect(bannedAdmin.banned).toBe(true);
    });

    it('admin can ban an employee but not another admin', async () => {
      const actingAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const otherAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const headers = await signInHeaders(actingAdmin.email);

      const banned = await service.ban(
        EMPLOYEE_ROLE.ADMIN,
        headers,
        employee.id,
        {},
      );
      expect(banned.banned).toBe(true);

      await expect(
        service.ban(EMPLOYEE_ROLE.ADMIN, headers, otherAdmin.id, {}),
      ).rejects.toThrow();
    });

    it('nobody can ban the super_admin, including itself', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      await expect(
        service.ban(EMPLOYEE_ROLE.SUPER_ADMIN, headers, superAdmin.id, {}),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('super_admin can remove an employee and an admin', async () => {
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const headers = await signInHeaders(superAdmin.email);

      const result = await service.remove(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        employee.id,
      );
      expect(result.success).toBe(true);
      await expect(
        prisma.employeeAccount.findUniqueOrThrow({
          where: { id: employee.id },
        }),
      ).rejects.toThrow();
      seededAccountIds.splice(seededAccountIds.indexOf(employee.id), 1);

      const adminResult = await service.remove(
        EMPLOYEE_ROLE.SUPER_ADMIN,
        headers,
        admin.id,
      );
      expect(adminResult.success).toBe(true);
      seededAccountIds.splice(seededAccountIds.indexOf(admin.id), 1);
    });

    it('admin can remove an employee but not another admin or the super_admin', async () => {
      const actingAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const otherAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const superAdmin = await seedAccount(EMPLOYEE_ROLE.SUPER_ADMIN);
      const headers = await signInHeaders(actingAdmin.email);

      const result = await service.remove(
        EMPLOYEE_ROLE.ADMIN,
        headers,
        employee.id,
      );
      expect(result.success).toBe(true);
      seededAccountIds.splice(seededAccountIds.indexOf(employee.id), 1);

      await expect(
        service.remove(EMPLOYEE_ROLE.ADMIN, headers, otherAdmin.id),
      ).rejects.toThrow();
      await expect(
        service.remove(EMPLOYEE_ROLE.ADMIN, headers, superAdmin.id),
      ).rejects.toThrow();
    });
  });
});
