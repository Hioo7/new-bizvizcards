import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { SmartCardTemplateKey } from '../../src/generated/prisma/client';

describe('Public exchange-contact submission (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededCardIds: string[] = [];

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

    await prisma.smartCardTemplate.upsert({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
      update: {},
      create: {
        key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        name: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      },
    });
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
        email: `exchange-contact-e2e-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedSmartCard(customerId: string | null) {
    const template = await prisma.smartCardTemplate.findUniqueOrThrow({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
    });
    const card = await prisma.smartCard.create({
      data: {
        templateId: template.id,
        endpoint: `exchange-contact-e2e-${randomUUID()}`,
        customerId,
      },
    });
    seededCardIds.push(card.id);
    return card;
  }

  it('creates a Lead in the DB, linked to the card owner and the sourcing smart card, filed via the active-folder fallback', async () => {
    const customer = await seedCustomer();
    const folder = await prisma.leadFolder.create({
      data: { customerId: customer.id, name: 'Active Folder' },
    });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { defaultLeadFolderId: folder.id },
    });
    const smartCard = await seedSmartCard(customer.id);

    const response = await request(app.getHttpServer())
      .post(`/api/public/smart-cards/${smartCard.endpoint}/exchange-contact`)
      .send({
        name: 'Visitor',
        countryDialCode: '91',
        phoneNumber: '9876543210',
        email: 'visitor@example.com',
        locationLatitude: 12.9716,
        locationLongitude: 77.5946,
      })
      .expect(201);

    const created = response.body as {
      id: string;
      customerId: string;
      sourceSmartCardId: string;
      folderId: string;
    };
    expect(created.customerId).toBe(customer.id);
    expect(created.sourceSmartCardId).toBe(smartCard.id);
    expect(created.folderId).toBe(folder.id);

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(lead.name).toBe('Visitor');
    expect(lead.phoneNumber).toBe('9876543210');
  });

  it('rejects a submission missing the required phone number', async () => {
    const customer = await seedCustomer();
    const smartCard = await seedSmartCard(customer.id);

    await request(app.getHttpServer())
      .post(`/api/public/smart-cards/${smartCard.endpoint}/exchange-contact`)
      .send({ name: 'Visitor' })
      .expect(400);
  });

  it('returns 404 when the smart card endpoint does not exist', async () => {
    await request(app.getHttpServer())
      .post('/api/public/smart-cards/does-not-exist/exchange-contact')
      .send({
        name: 'Visitor',
        countryDialCode: '91',
        phoneNumber: '9876543210',
      })
      .expect(404);
  });

  it('returns 404 when the smart card has no linked customer', async () => {
    const smartCard = await seedSmartCard(null);

    await request(app.getHttpServer())
      .post(`/api/public/smart-cards/${smartCard.endpoint}/exchange-contact`)
      .send({
        name: 'Visitor',
        countryDialCode: '91',
        phoneNumber: '9876543210',
      })
      .expect(404);
  });
});
