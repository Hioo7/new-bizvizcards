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

describe('Redirects (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let fakeOtpSender: FakeOtpSender;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededInternalIds: string[] = [];
  const seededExternalIds: string[] = [];
  const seededRestrictedPathIds: string[] = [];

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
    if (seededInternalIds.length > 0) {
      await prisma.internalRedirectRoute.deleteMany({
        where: { id: { in: seededInternalIds } },
      });
      seededInternalIds.length = 0;
    }
    if (seededExternalIds.length > 0) {
      await prisma.externalRedirectRoute.deleteMany({
        where: { id: { in: seededExternalIds } },
      });
      seededExternalIds.length = 0;
    }
    if (seededRestrictedPathIds.length > 0) {
      await prisma.restrictedRedirectPath.deleteMany({
        where: { id: { in: seededRestrictedPathIds } },
      });
      seededRestrictedPathIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  function uniquePath(prefix: string): string {
    return `/${prefix}-${randomUUID()}`;
  }

  async function seedAccount(role: string) {
    const account = await prisma.employeeAccount.create({
      data: {
        name: `Test ${role}`,
        email: `redirects-e2e-${randomUUID()}@example.com`,
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

  async function seedInternal(sourcePath: string, targetPath: string) {
    const route = await prisma.internalRedirectRoute.create({
      data: { sourcePath, targetPath },
    });
    seededInternalIds.push(route.id);
    return route;
  }

  async function seedExternal(sourcePath: string, destinationUrl: string) {
    const route = await prisma.externalRedirectRoute.create({
      data: { sourcePath, destinationUrl },
    });
    seededExternalIds.push(route.id);
    return route;
  }

  describe('RBAC', () => {
    it('rejects an unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/redirects/internal')
        .expect(401);
    });

    it('allows an employee to list but denies create/update/delete', async () => {
      const employee = await seedAccount(EMPLOYEE_ROLE.EMPLOYEE);
      const cookie = await signInCookie(employee.email);
      const seeded = await seedInternal(uniquePath('emp-view'), '/target');

      await request(app.getHttpServer())
        .get('/api/redirects/internal')
        .set('Cookie', cookie)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/redirects/internal')
        .set('Cookie', cookie)
        .send({ sourcePath: uniquePath('emp-create'), targetPath: '/x' })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/api/redirects/internal/${seeded.id}`)
        .set('Cookie', cookie)
        .send({ enabled: false })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/redirects/internal/${seeded.id}`)
        .set('Cookie', cookie)
        .expect(403);
    });

    it('allows an admin to create, update, and delete', async () => {
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const cookie = await signInCookie(admin.email);
      const sourcePath = uniquePath('admin-create');

      const created = await request(app.getHttpServer())
        .post('/api/redirects/internal')
        .set('Cookie', cookie)
        .send({ sourcePath, targetPath: '/target' })
        .expect(201);

      seededInternalIds.push((created.body as { id: string }).id);

      await request(app.getHttpServer())
        .patch(`/api/redirects/internal/${(created.body as { id: string }).id}`)
        .set('Cookie', cookie)
        .send({ enabled: false })
        .expect(200);

      await request(app.getHttpServer())
        .delete(
          `/api/redirects/internal/${(created.body as { id: string }).id}`,
        )
        .set('Cookie', cookie)
        .expect(200);
    });
  });

  describe('restricted-path enforcement', () => {
    it('blocks an internal redirect whose sourcePath is restricted', async () => {
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const cookie = await signInCookie(admin.email);
      const path = uniquePath('restricted');
      const restricted = await prisma.restrictedRedirectPath.create({
        data: { path },
      });
      seededRestrictedPathIds.push(restricted.id);

      await request(app.getHttpServer())
        .post('/api/redirects/internal')
        .set('Cookie', cookie)
        .send({ sourcePath: path, targetPath: '/target' })
        .expect(400);
    });

    it('blocks an external redirect whose sourcePath is restricted (the legacy gap, fixed)', async () => {
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const cookie = await signInCookie(admin.email);
      const path = uniquePath('restricted');
      const restricted = await prisma.restrictedRedirectPath.create({
        data: { path },
      });
      seededRestrictedPathIds.push(restricted.id);

      await request(app.getHttpServer())
        .post('/api/redirects/external')
        .set('Cookie', cookie)
        .send({ sourcePath: path, destinationUrl: 'https://example.com' })
        .expect(400);
    });
  });

  describe('duplicate sourcePath', () => {
    it('returns 409 for a duplicate internal sourcePath', async () => {
      const admin = await seedAccount(EMPLOYEE_ROLE.ADMIN);
      const cookie = await signInCookie(admin.email);
      const seeded = await seedInternal(uniquePath('dup'), '/target');

      await request(app.getHttpServer())
        .post('/api/redirects/internal')
        .set('Cookie', cookie)
        .send({ sourcePath: seeded.sourcePath, targetPath: '/other' })
        .expect(409);
    });
  });

  describe('public resolve endpoint', () => {
    it('returns a 307 with Location for an internal match', async () => {
      const sourcePath = uniquePath('public-internal');
      await seedInternal(sourcePath, '/new-target');

      const response = await request(app.getHttpServer())
        .get('/api/public/redirects/resolve')
        .query({ path: sourcePath })
        .redirects(0);

      expect(response.status).toBe(307);
      expect(response.headers.location).toBe('/new-target');
    });

    it('returns a 307 with Location for an external match', async () => {
      const sourcePath = uniquePath('public-external');
      await seedExternal(sourcePath, 'https://example.com');

      const response = await request(app.getHttpServer())
        .get('/api/public/redirects/resolve')
        .query({ path: sourcePath })
        .redirects(0);

      expect(response.status).toBe(307);
      expect(response.headers.location).toBe('https://example.com');
    });

    it('returns 404 when nothing matches', async () => {
      await request(app.getHttpServer())
        .get('/api/public/redirects/resolve')
        .query({ path: uniquePath('unmatched') })
        .expect(404);
    });

    it('returns 404 for a disabled route (falls through to the SPA at the edge)', async () => {
      const sourcePath = uniquePath('public-disabled');
      const route = await prisma.internalRedirectRoute.create({
        data: { sourcePath, targetPath: '/target', enabled: false },
      });
      seededInternalIds.push(route.id);

      await request(app.getHttpServer())
        .get('/api/public/redirects/resolve')
        .query({ path: sourcePath })
        .expect(404);
    });
  });
});
