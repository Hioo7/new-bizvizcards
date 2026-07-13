import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Public E-card endpoints (e2e, TEST_DATABASE_URL only)', () => {
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

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `ecards-public-e2e-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEcard(
    customerId: string,
    overrides?: {
      heroCompanyName?: string;
      phoneCountryDialCode?: string;
      phoneNumber?: string;
    },
  ) {
    const card = await prisma.eCard.create({
      data: {
        customerId,
        endpoint: `ecards-public-e2e-${randomUUID()}`,
        heroCompanyName: overrides?.heroCompanyName,
        phoneCountryDialCode: overrides?.phoneCountryDialCode,
        phoneNumber: overrides?.phoneNumber,
      },
    });
    seededEcardIds.push(card.id);
    return card;
  }

  describe('GET /:endpoint', () => {
    it('returns the card by endpoint', async () => {
      const customer = await seedCustomer('Jane Doe');
      const card = await seedEcard(customer.id, { heroCompanyName: 'Acme' });

      const response = await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}`)
        .expect(200);

      const body = response.body as {
        id: string;
        hero: { name: string; companyName: string };
      };
      expect(body.id).toBe(card.id);
      expect(body.hero.name).toBe('Jane Doe');
      expect(body.hero.companyName).toBe('Acme');
    });

    it('404s for an unknown endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/public/ecards/does-not-exist')
        .expect(404);
    });
  });

  describe('POST /:endpoint/exchange-contact', () => {
    it('creates a Lead sourced from the e-card, filed via the default folder', async () => {
      const customer = await seedCustomer();
      const folder = await prisma.leadFolder.create({
        data: { customerId: customer.id, name: 'Active Folder' },
      });
      await prisma.customer.update({
        where: { id: customer.id },
        data: { defaultLeadFolderId: folder.id },
      });
      const card = await seedEcard(customer.id);

      const response = await request(app.getHttpServer())
        .post(`/api/public/ecards/${card.endpoint}/exchange-contact`)
        .send({
          name: 'Visitor',
          countryDialCode: '91',
          phoneNumber: '9876543210',
          email: 'visitor@example.com',
        })
        .expect(201);

      const created = response.body as {
        id: string;
        customerId: string;
        sourcedBy: string;
        folderId: string;
      };
      expect(created.customerId).toBe(customer.id);
      expect(created.sourcedBy).toBe('E_CARD');
      expect(created.folderId).toBe(folder.id);
    });

    it('rejects a submission missing the required phone number', async () => {
      const customer = await seedCustomer();
      const card = await seedEcard(customer.id);

      await request(app.getHttpServer())
        .post(`/api/public/ecards/${card.endpoint}/exchange-contact`)
        .send({ name: 'Visitor' })
        .expect(400);
    });

    it('404s for an unknown endpoint', async () => {
      await request(app.getHttpServer())
        .post('/api/public/ecards/does-not-exist/exchange-contact')
        .send({
          name: 'Visitor',
          countryDialCode: '91',
          phoneNumber: '9876543210',
        })
        .expect(404);
    });
  });

  describe('GET /:endpoint/vcard', () => {
    it('returns vcard text including name, company, email, and phone', async () => {
      const customer = await seedCustomer('Jane Doe');
      const card = await seedEcard(customer.id, {
        heroCompanyName: 'Acme',
        phoneCountryDialCode: '91',
        phoneNumber: '9876543210',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}/vcard`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/vcard');
      expect(response.headers['content-disposition']).toContain('inline');
      expect(response.text).toContain('FN:Jane Doe');
      expect(response.text).toContain('ORG:Acme');
      expect(response.text).toContain('TEL;TYPE=CELL:+919876543210');
    });
  });
});
