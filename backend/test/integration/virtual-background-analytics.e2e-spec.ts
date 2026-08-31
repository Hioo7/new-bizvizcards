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
import {
  ECardEventType,
  ECardTrafficSource,
  MediaSource,
  VirtualBackgroundQrCorner,
} from '../../src/generated/prisma/client';
import type { CustomerModel } from '../../src/generated/prisma/models';

describe('Virtual background analytics (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededMediaIds: string[] = [];

  const ANALYTICS_PATH = '/api/customer/virtual-backgrounds/analytics';

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
    if (seededMediaIds.length > 0) {
      await prisma.media.deleteMany({ where: { id: { in: seededMediaIds } } });
      seededMediaIds.length = 0;
    }
  });

  async function seedCustomer(): Promise<{
    customer: CustomerModel;
    cookie: string;
  }> {
    const email = `vb-analytics-e2e-${randomUUID()}@example.com`;
    const password = `Passw0rd-${randomUUID()}`;

    const signUp = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-up/email`)
      .send({ email, password, name: 'Test Customer' })
      .expect(200);
    const accountId = (signUp.body as { user: { id: string } }).user.id;
    seededAccountIds.push(accountId);

    const signIn = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-in/email`)
      .send({ email, password })
      .expect(200);
    const setCookie = signIn.headers['set-cookie'] as unknown as string[];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { accountId },
    });
    return { customer, cookie };
  }

  async function seedEcard(customerId: string) {
    return prisma.eCard.create({
      data: {
        customerId,
        endpoint: `vb-analytics-e2e-${randomUUID()}`,
        heroName: 'Test',
        heroEmail: `vb-analytics-e2e-hero-${randomUUID()}@example.com`,
      },
    });
  }

  async function seedVirtualBackground(customerId: string, ecardId: string) {
    const media = await prisma.media.create({
      data: {
        id: randomUUID(),
        source: MediaSource.MINIO,
        storageKey: `virtual-backgrounds/${randomUUID()}.png`,
        originalName: 'vb.png',
        extension: 'png',
      },
    });
    seededMediaIds.push(media.id);
    return prisma.virtualBackground.create({
      data: {
        customerId,
        ecardId,
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
        composedMediaId: media.id,
      },
    });
  }

  async function seedEvent(
    ecardId: string,
    type: ECardEventType,
    options: {
      source?: ECardTrafficSource;
      sourceRefId?: string | null;
      createdAt?: Date;
    } = {},
  ) {
    await prisma.eCardEvent.create({
      data: {
        ecardId,
        type,
        source: options.source ?? ECardTrafficSource.VIRTUAL_BACKGROUND,
        sourceRefId: options.sourceRefId ?? null,
        createdAt: options.createdAt ?? new Date(),
      },
    });
  }

  it('returns 401 when unauthenticated', async () => {
    await request(app.getHttpServer()).get(ANALYTICS_PATH).expect(401);
  });

  it('returns a zeroed payload for a customer with no virtual backgrounds', async () => {
    const { cookie } = await seedCustomer();

    const response = await request(app.getHttpServer())
      .get(ANALYTICS_PATH)
      .set('Cookie', cookie)
      .expect(200);

    const body = response.body as {
      totals: { views: number; exchangeContacts: number };
      perBackground: unknown[];
      dailyCounts: unknown[];
    };
    expect(body.totals).toEqual({ views: 0, exchangeContacts: 0 });
    expect(body.perBackground).toEqual([]);
    expect(body.dailyCounts.length).toBeGreaterThan(0);
  });

  it('aggregates VIEW and EXCHANGE_CONTACT events per background, ignoring DIRECT and other customers', async () => {
    const { customer, cookie } = await seedCustomer();
    const card = await seedEcard(customer.id);
    const vb = await seedVirtualBackground(customer.id, card.id);

    await seedEvent(card.id, ECardEventType.VIEW, { sourceRefId: vb.id });
    await seedEvent(card.id, ECardEventType.VIEW, { sourceRefId: vb.id });
    await seedEvent(card.id, ECardEventType.EXCHANGE_CONTACT, {
      sourceRefId: vb.id,
    });
    // Noise that must not be counted.
    await seedEvent(card.id, ECardEventType.VIEW, {
      source: ECardTrafficSource.DIRECT,
      sourceRefId: vb.id,
    });
    const other = await seedCustomer();
    const otherCard = await seedEcard(other.customer.id);
    const otherVb = await seedVirtualBackground(
      other.customer.id,
      otherCard.id,
    );
    await seedEvent(otherCard.id, ECardEventType.VIEW, {
      sourceRefId: otherVb.id,
    });

    const response = await request(app.getHttpServer())
      .get(ANALYTICS_PATH)
      .set('Cookie', cookie)
      .expect(200);

    const body = response.body as {
      totals: { views: number; exchangeContacts: number };
      perBackground: {
        virtualBackgroundId: string;
        views: number;
        exchangeContacts: number;
      }[];
    };
    expect(body.totals).toEqual({ views: 2, exchangeContacts: 1 });
    expect(body.perBackground).toHaveLength(1);
    expect(body.perBackground[0]).toMatchObject({
      virtualBackgroundId: vb.id,
      views: 2,
      exchangeContacts: 1,
    });
  });

  it('narrows results to the requested window and rejects an inverted range', async () => {
    const { customer, cookie } = await seedCustomer();
    const card = await seedEcard(customer.id);
    const vb = await seedVirtualBackground(customer.id, card.id);
    await seedEvent(card.id, ECardEventType.VIEW, {
      sourceRefId: vb.id,
      createdAt: new Date('2000-01-01T00:00:00.000Z'),
    });

    const inRange = await request(app.getHttpServer())
      .get(ANALYTICS_PATH)
      .query({ from: '1999-12-01', to: '2000-02-01' })
      .set('Cookie', cookie)
      .expect(200);
    expect((inRange.body as { totals: { views: number } }).totals.views).toBe(
      1,
    );

    const current = await request(app.getHttpServer())
      .get(ANALYTICS_PATH)
      .set('Cookie', cookie)
      .expect(200);
    expect((current.body as { totals: { views: number } }).totals.views).toBe(
      0,
    );

    await request(app.getHttpServer())
      .get(ANALYTICS_PATH)
      .query({ from: '2026-02-01', to: '2026-01-01' })
      .set('Cookie', cookie)
      .expect(400);
  });
});
