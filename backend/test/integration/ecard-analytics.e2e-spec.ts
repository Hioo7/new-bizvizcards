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
import { ECardEventType } from '../../src/generated/prisma/client';
import type { CustomerModel } from '../../src/generated/prisma/models';

describe('E-card analytics summary (e2e, TEST_DATABASE_URL only)', () => {
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
    const email = `ecard-analytics-e2e-${randomUUID()}@example.com`;
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

  describe('GET /api/ecards/me/:ecardId/analytics', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/ecards/me/${randomUUID()}/analytics`)
        .expect(401);
    });

    it('returns 404 when the ecard does not belong to the caller', async () => {
      const { cookie } = await seedCustomer();

      await request(app.getHttpServer())
        .get(`/api/ecards/me/${randomUUID()}/analytics`)
        .set('Cookie', cookie)
        .expect(404);
    });

    it("returns totals and daily buckets for the caller's own ecard", async () => {
      const { customer, cookie } = await seedCustomer();
      const card = await prisma.eCard.create({
        data: {
          customerId: customer.id,
          endpoint: `ecard-analytics-e2e-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: `ecard-analytics-e2e-hero-${randomUUID()}@example.com`,
        },
      });
      const today = new Date();
      await prisma.eCardEvent.create({
        data: {
          ecardId: card.id,
          type: ECardEventType.VIEW,
          createdAt: today,
          durationMs: 1000,
        },
      });
      await prisma.eCardEvent.create({
        data: {
          ecardId: card.id,
          type: ECardEventType.VIEW,
          createdAt: today,
          durationMs: 3000,
        },
      });
      await prisma.eCardEvent.create({
        data: {
          ecardId: card.id,
          type: ECardEventType.WALLET_SAVE,
          createdAt: today,
        },
      });
      await prisma.eCardEvent.create({
        data: {
          ecardId: card.id,
          type: ECardEventType.CONTACT_SAVE,
          createdAt: today,
        },
      });
      await prisma.eCardEvent.create({
        data: {
          ecardId: card.id,
          type: ECardEventType.EXCHANGE_CONTACT,
          createdAt: today,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/ecards/me/${card.id}/analytics`)
        .set('Cookie', cookie)
        .expect(200);

      const body = response.body as {
        totalViews: number;
        totalWalletSaves: number;
        totalContactSaves: number;
        totalExchangeContacts: number;
        averageViewDurationMs: number | null;
        dailyCounts: {
          date: string;
          views: number;
          walletSaves: number;
          contactSaves: number;
          exchangeContacts: number;
        }[];
      };
      expect(body.totalViews).toBe(2);
      expect(body.totalWalletSaves).toBe(1);
      expect(body.totalContactSaves).toBe(1);
      expect(body.totalExchangeContacts).toBe(1);
      expect(body.averageViewDurationMs).toBe(2000);
      const todayKey = today.toISOString().slice(0, 10);
      const todayBucket = body.dailyCounts.find((day) => day.date === todayKey);
      expect(todayBucket).toEqual({
        date: todayKey,
        views: 2,
        walletSaves: 1,
        contactSaves: 1,
        exchangeContacts: 1,
      });
    });

    it('rejects from after to', async () => {
      const { cookie } = await seedCustomer();

      await request(app.getHttpServer())
        .get(
          `/api/ecards/me/${randomUUID()}/analytics?from=2026-02-01&to=2026-01-01`,
        )
        .set('Cookie', cookie)
        .expect(400);
    });
  });
});
