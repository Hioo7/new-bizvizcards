import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  EMPLOYEE_AUTH,
  EMPLOYEE_AUTH_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { EmployeeAuth } from '../../src/common/auth/employee-auth.factory';
import { NodemailerOtpSender } from '../../src/common/auth/otp-sender/nodemailer-otp-sender.service';
import { EMPLOYEE_ROLE } from '../../src/common/constants/roles.constants';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';

class FakeOtpSender {
  private lastOtpByEmail = new Map<string, string>();

  send({ email, otp }: { email: string; otp: string }): Promise<void> {
    this.lastOtpByEmail.set(email, otp);
    return Promise.resolve();
  }

  otpFor(email: string): string {
    const otp = this.lastOtpByEmail.get(email);
    if (!otp) throw new Error(`No OTP captured for ${email}`);
    return otp;
  }
}

describe('Staff management guard chain (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let fakeOtpSender: FakeOtpSender;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    fakeOtpSender = new FakeOtpSender();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NodemailerOtpSender)
      .useValue(fakeOtpSender)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });

    const employeeAuth = app.get<EmployeeAuth>(EMPLOYEE_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.all(
      `${EMPLOYEE_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(employeeAuth),
    );
    app.use(express.json());
    app.useGlobalFilters(new BetterAuthApiErrorFilter());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedAccount(role: string) {
    const account = await prisma.employeeAccount.create({
      data: {
        name: `Test ${role}`,
        email: `staff-e2e-${randomUUID()}@example.com`,
        emailVerified: true,
        role,
      },
    });
    seededAccountIds.push(account.id);
    return account;
  }

  async function signInCookie(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post(`${EMPLOYEE_AUTH_BASE_PATH}/email-otp/send-verification-otp`)
      .send({ email, type: 'sign-in' })
      .expect(200);

    const otp = fakeOtpSender.otpFor(email);

    const response = await request(app.getHttpServer())
      .post(`${EMPLOYEE_AUTH_BASE_PATH}/sign-in/email-otp`)
      .send({ email, otp })
      .expect(200);

    const setCookie = response.headers['set-cookie'] as unknown as string[];
    return setCookie.map((cookie) => cookie.split(';')[0]).join('; ');
  }

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer()).get('/api/staff').expect(401);
  });

  it('allows an employee to list staff but denies creating one', async () => {
    const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
    const cookie = await signInCookie(employee.email);

    await request(app.getHttpServer())
      .get('/api/staff')
      .set('Cookie', cookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/staff')
      .set('Cookie', cookie)
      .send({
        email: `blocked-${randomUUID()}@example.com`,
        name: 'Blocked',
        role: EMPLOYEE_ROLE.EMPLOYEE,
      })
      .expect(403);
  });

  it("denies an admin from changing a staff member's role", async () => {
    const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
    const targetEmployee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
    const cookie = await signInCookie(admin.email);

    await request(app.getHttpServer())
      .patch(`/api/staff/${targetEmployee.id}/role`)
      .set('Cookie', cookie)
      .send({ role: EMPLOYEE_ROLE.ADMIN })
      .expect(403);
  });

  it('denies an admin from removing another admin, end to end', async () => {
    const actingAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
    const otherAdmin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
    const cookie = await signInCookie(actingAdmin.email);

    await request(app.getHttpServer())
      .delete(`/api/staff/${otherAdmin.id}`)
      .set('Cookie', cookie)
      .expect(403);
  });
});
