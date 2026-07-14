import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  CUSTOMER_AUTH,
  CUSTOMER_AUTH_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { CustomerAuth } from '../../src/common/auth/customer-auth.factory';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import type { CustomerModel } from '../../src/generated/prisma/models';

describe('E-card Add to Google Wallet (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });

    const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.all(
      `${CUSTOMER_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(customerAuth),
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
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedCustomer(): Promise<{
    customer: CustomerModel;
    cookie: string;
  }> {
    const email = `ecard-wallet-e2e-${randomUUID()}@example.com`;
    const password = `Passw0rd-${randomUUID()}`;

    const signUpResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-up/email`)
      .send({ email, password, name: 'Test Customer' })
      .expect(200);

    const accountId = (signUpResponse.body as { user: { id: string } }).user.id;
    seededAccountIds.push(accountId);

    const signInResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-in/email`)
      .send({ email, password })
      .expect(200);

    const setCookie = signInResponse.headers[
      'set-cookie'
    ] as unknown as string[];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { accountId },
    });

    return { customer, cookie };
  }

  describe('GET /api/ecards/me/:ecardId/wallet/google', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/ecards/me/${randomUUID()}/wallet/google`)
        .expect(401);
    });

    it('returns 404 when the ecard does not belong to the caller', async () => {
      const { cookie } = await seedCustomer();

      await request(app.getHttpServer())
        .get(`/api/ecards/me/${randomUUID()}/wallet/google`)
        .set('Cookie', cookie)
        .expect(404);
    });

    it('fails gracefully (not a 500) and does not record a WALLET_SAVE event when Google Wallet is not configured', async () => {
      const { customer, cookie } = await seedCustomer();
      const card = await prisma.eCard.create({
        data: {
          customerId: customer.id,
          endpoint: `ecard-wallet-e2e-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: `ecard-wallet-e2e-hero-${randomUUID()}@example.com`,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/ecards/me/${card.id}/wallet/google`)
        .set('Cookie', cookie);

      expect(response.status).toBe(503);

      const events = await prisma.eCardEvent.findMany({
        where: { ecardId: card.id },
      });
      expect(events).toHaveLength(0);
    });
  });

  describe('GET /api/employee/ecards/:id/wallet/google', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/employee/ecards/some-id/wallet/google')
        .expect(401);
    });
  });
});
