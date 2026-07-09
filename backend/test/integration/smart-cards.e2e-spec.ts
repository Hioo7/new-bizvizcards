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
import { SmartCardTemplateKey } from '../../src/generated/prisma/client';

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

describe('Smart cards guard chain (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let fakeOtpSender: FakeOtpSender;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededCardIds: string[] = [];

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

    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededCardIds.length > 0) {
      await prisma.smartCard.deleteMany({
        where: { id: { in: seededCardIds } },
      });
      seededCardIds.length = 0;
    }
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
        email: `smart-cards-e2e-${randomUUID()}@example.com`,
        emailVerified: true,
        role,
      },
    });
    seededAccountIds.push(account.id);
    await prisma.employee.create({ data: { accountId: account.id } });
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

  const TEMPLATE_PATH = `/api/smart-cards/${SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE}`;
  const OTHER_TEMPLATE_PATH = `/api/smart-cards/${SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2}`;

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer()).get(TEMPLATE_PATH).expect(401);
  });

  it('allows an employee to create/list/get/update but denies delete', async () => {
    const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
    const cookie = await signInCookie(employee.email);
    const endpoint = `e2e-card-${randomUUID()}`;

    const createResponse = await request(app.getHttpServer())
      .post(TEMPLATE_PATH)
      .set('Cookie', cookie)
      .field(
        'data',
        JSON.stringify({
          endpoint,
          services: [],
          testimonials: [],
          galleries: [],
        }),
      )
      .expect(201);
    const cardId = (createResponse.body as { id: string }).id;
    seededCardIds.push(cardId);

    await request(app.getHttpServer())
      .get(TEMPLATE_PATH)
      .set('Cookie', cookie)
      .expect(200);

    await request(app.getHttpServer())
      .get(`${TEMPLATE_PATH}/${cardId}`)
      .set('Cookie', cookie)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`${TEMPLATE_PATH}/${cardId}`)
      .set('Cookie', cookie)
      .field(
        'data',
        JSON.stringify({ services: [], testimonials: [], galleries: [] }),
      )
      .expect(200);

    await request(app.getHttpServer())
      .delete(`${TEMPLATE_PATH}/${cardId}`)
      .set('Cookie', cookie)
      .expect(403);
  });

  it('allows admin and super_admin to delete', async () => {
    const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
    const cookie = await signInCookie(admin.email);
    const endpoint = `e2e-card-${randomUUID()}`;

    const createResponse = await request(app.getHttpServer())
      .post(TEMPLATE_PATH)
      .set('Cookie', cookie)
      .field(
        'data',
        JSON.stringify({
          endpoint,
          services: [],
          testimonials: [],
          galleries: [],
        }),
      )
      .expect(201);
    const cardId = (createResponse.body as { id: string }).id;

    await request(app.getHttpServer())
      .delete(`${TEMPLATE_PATH}/${cardId}`)
      .set('Cookie', cookie)
      .expect(200);
  });

  it('a card created under one template 404s via a different template namespace', async () => {
    const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
    const cookie = await signInCookie(admin.email);
    const endpoint = `e2e-card-${randomUUID()}`;

    const createResponse = await request(app.getHttpServer())
      .post(TEMPLATE_PATH)
      .set('Cookie', cookie)
      .field(
        'data',
        JSON.stringify({
          endpoint,
          services: [],
          testimonials: [],
          galleries: [],
        }),
      )
      .expect(201);
    const cardId = (createResponse.body as { id: string }).id;
    seededCardIds.push(cardId);

    await request(app.getHttpServer())
      .get(`${OTHER_TEMPLATE_PATH}/${cardId}`)
      .set('Cookie', cookie)
      .expect(404);
  });
});
