import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  ECardEventType,
  ECardTrafficSource,
} from '../../src/generated/prisma/client';

describe('Public e-card traffic attribution (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEcardIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    app.use(express.json());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededEcardIds.length > 0) {
      await prisma.eCard.deleteMany({ where: { id: { in: seededEcardIds } } });
      seededEcardIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `traffic-attribution-e2e-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEcard(customerId: string) {
    const card = await prisma.eCard.create({
      data: {
        customerId,
        endpoint: `traffic-attribution-e2e-${randomUUID()}`,
        heroName: 'Test Customer',
        heroEmail: `traffic-attribution-e2e-hero-${randomUUID()}@example.com`,
      },
    });
    seededEcardIds.push(card.id);
    return card;
  }

  function latestEvent(ecardId: string, type: ECardEventType) {
    return prisma.eCardEvent.findFirstOrThrow({
      where: { ecardId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  describe('GET /:endpoint', () => {
    it('records a VIEW attributed to a virtual background when src + sref are present', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);
      const sref = randomUUID();

      await request(app.getHttpServer())
        .get(
          `/api/public/ecards/${card.endpoint}?src=virtual-background&sref=${sref}`,
        )
        .expect(200);

      const event = await latestEvent(card.id, ECardEventType.VIEW);
      expect(event.source).toBe(ECardTrafficSource.VIRTUAL_BACKGROUND);
      expect(event.sourceRefId).toBe(sref);
    });

    it('records a DIRECT VIEW when no attribution params are present', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);

      await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}`)
        .expect(200);

      const event = await latestEvent(card.id, ECardEventType.VIEW);
      expect(event.source).toBe(ECardTrafficSource.DIRECT);
      expect(event.sourceRefId).toBeNull();
    });

    it('falls back to DIRECT for an unrecognised src token', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);

      await request(app.getHttpServer())
        .get(
          `/api/public/ecards/${card.endpoint}?src=email-signature&sref=${randomUUID()}`,
        )
        .expect(200);

      const event = await latestEvent(card.id, ECardEventType.VIEW);
      expect(event.source).toBe(ECardTrafficSource.DIRECT);
    });

    it('still serves the card and records DIRECT when sref is not a uuid', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);

      await request(app.getHttpServer())
        .get(
          `/api/public/ecards/${card.endpoint}?src=virtual-background&sref=not-a-uuid`,
        )
        .expect(200);

      const event = await latestEvent(card.id, ECardEventType.VIEW);
      expect(event.source).toBe(ECardTrafficSource.DIRECT);
    });
  });

  describe('POST /:endpoint/exchange-contact', () => {
    it('records an EXCHANGE_CONTACT attributed to the virtual background', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);
      const sref = randomUUID();

      await request(app.getHttpServer())
        .post(`/api/public/ecards/${card.endpoint}/exchange-contact`)
        .send({
          name: 'Visitor',
          countryDialCode: '91',
          phoneNumber: '9876543210',
          trafficSource: 'virtual-background',
          trafficSourceRefId: sref,
        })
        .expect(201);

      const event = await latestEvent(card.id, ECardEventType.EXCHANGE_CONTACT);
      expect(event.source).toBe(ECardTrafficSource.VIRTUAL_BACKGROUND);
      expect(event.sourceRefId).toBe(sref);
    });

    it('records a DIRECT EXCHANGE_CONTACT when no traffic fields are sent', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);

      await request(app.getHttpServer())
        .post(`/api/public/ecards/${card.endpoint}/exchange-contact`)
        .send({
          name: 'Visitor',
          countryDialCode: '91',
          phoneNumber: '9876543210',
        })
        .expect(201);

      const event = await latestEvent(card.id, ECardEventType.EXCHANGE_CONTACT);
      expect(event.source).toBe(ECardTrafficSource.DIRECT);
      expect(event.sourceRefId).toBeNull();
    });
  });
});
