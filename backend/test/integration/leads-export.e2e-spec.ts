import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  CUSTOMER_AUTH,
  CUSTOMER_AUTH_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { CustomerAuth } from '../../src/common/auth/customer-auth.factory';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import type { CustomerModel } from '../../src/generated/prisma/models';
import { LEAD_EXPORT_MAX_IDS } from '../../src/modules/leads/leads.constants';

describe('POST /api/leads/export (e2e, TEST_DATABASE_URL only)', () => {
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
    const email = `leads-export-e2e-${randomUUID()}@example.com`;
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

  async function createLead(cookie: string, name = 'Lead'): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/leads')
      .set('Cookie', cookie)
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  // supertest/superagent has no built-in parser for the xlsx content type,
  // so the response body must be collected as raw binary explicitly rather
  // than relying on default JSON/text parsing.
  function binaryParser(
    res: request.Response,
    callback: (err: Error | null, body: Buffer) => void,
  ) {
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
  }

  it('exports only requested, owned leads as a valid xlsx file with correct headers', async () => {
    const { cookie } = await seedCustomer();
    const leadId = await createLead(cookie, 'Alice');

    const response = await request(app.getHttpServer())
      .post('/api/leads/export')
      .set('Cookie', cookie)
      .send({ leadIds: [leadId] })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(response.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.headers['content-disposition']).toMatch(
      /attachment; filename="leads-\d+\.xlsx"/,
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((response.body as Buffer).buffer as ArrayBuffer);
    const worksheet = workbook.getWorksheet('Leads')!;
    expect(worksheet.getRow(2).getCell('A').value).toBe('Alice');
  });

  it("silently excludes another customer's lead ids from the export", async () => {
    const { cookie: cookieA } = await seedCustomer();
    const { cookie: cookieB } = await seedCustomer();
    const ownLeadId = await createLead(cookieA, 'Own Lead');
    const foreignLeadId = await createLead(cookieB, 'Foreign Lead');

    const response = await request(app.getHttpServer())
      .post('/api/leads/export')
      .set('Cookie', cookieA)
      .send({ leadIds: [ownLeadId, foreignLeadId] })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((response.body as Buffer).buffer as ArrayBuffer);
    const worksheet = workbook.getWorksheet('Leads')!;
    expect(worksheet.rowCount).toBe(2); // header + 1 owned lead
    expect(worksheet.getRow(2).getCell('A').value).toBe('Own Lead');
  });

  it('rejects an empty leadIds array', async () => {
    const { cookie } = await seedCustomer();

    await request(app.getHttpServer())
      .post('/api/leads/export')
      .set('Cookie', cookie)
      .send({ leadIds: [] })
      .expect(400);
  });

  it('rejects a leadIds array over the max size', async () => {
    const { cookie } = await seedCustomer();
    const leadIds = Array.from({ length: LEAD_EXPORT_MAX_IDS + 1 }, () =>
      randomUUID(),
    );

    await request(app.getHttpServer())
      .post('/api/leads/export')
      .set('Cookie', cookie)
      .send({ leadIds })
      .expect(400);
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .post('/api/leads/export')
      .send({ leadIds: [randomUUID()] })
      .expect(401);
  });
});
