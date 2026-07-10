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

describe('Lead CRM features: reference notes, stage, reminders (e2e, TEST_DATABASE_URL only)', () => {
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
    const email = `leads-crm-e2e-${randomUUID()}@example.com`;
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

  describe('reference notes', () => {
    it('supports full create/list/update/delete lifecycle', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      const createResponse = await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reference-notes`)
        .set('Cookie', cookie)
        .send({ content: 'First contact, interested in premium plan' })
        .expect(201);
      const note = createResponse.body as { id: string; content: string };
      expect(note.content).toBe('First contact, interested in premium plan');

      const secondCreate = await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reference-notes`)
        .set('Cookie', cookie)
        .send({ content: 'Second note' })
        .expect(201);
      const secondNote = secondCreate.body as { id: string };

      const listResponse = await request(app.getHttpServer())
        .get(`/api/leads/${leadId}/reference-notes`)
        .set('Cookie', cookie)
        .expect(200);
      const list = listResponse.body as Array<{ id: string }>;
      expect(list.map((n) => n.id)).toEqual([secondNote.id, note.id]);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/leads/${leadId}/reference-notes/${note.id}`)
        .set('Cookie', cookie)
        .send({ content: 'Updated note' })
        .expect(200);
      expect((updateResponse.body as { content: string }).content).toBe(
        'Updated note',
      );

      await request(app.getHttpServer())
        .delete(`/api/leads/${leadId}/reference-notes/${note.id}`)
        .set('Cookie', cookie)
        .expect(200);

      const foundDeleted = await prisma.leadReferenceNote.findUnique({
        where: { id: note.id },
      });
      expect(foundDeleted).toBeNull();
    });

    it('returns 404 for a lead not owned by the caller', async () => {
      const { cookie: cookieA } = await seedCustomer();
      const { cookie: cookieB } = await seedCustomer();
      const leadId = await createLead(cookieA);

      await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reference-notes`)
        .set('Cookie', cookieB)
        .send({ content: 'Trying to attach' })
        .expect(404);
    });

    it('returns 400 for empty content', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reference-notes`)
        .set('Cookie', cookie)
        .send({ content: '' })
        .expect(400);
    });

    it('rejects unauthenticated requests', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      await request(app.getHttpServer())
        .get(`/api/leads/${leadId}/reference-notes`)
        .expect(401);
    });
  });

  describe('stage', () => {
    it('is null on a freshly created lead and settable/clearable via PATCH', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/leads/${leadId}`)
        .set('Cookie', cookie)
        .expect(200);
      expect((getResponse.body as { stage: string | null }).stage).toBeNull();

      const setResponse = await request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .set('Cookie', cookie)
        .send({ stage: 'PROPOSAL_DEMO' })
        .expect(200);
      expect((setResponse.body as { stage: string }).stage).toBe(
        'PROPOSAL_DEMO',
      );

      const clearResponse = await request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .set('Cookie', cookie)
        .send({ stage: null })
        .expect(200);
      expect((clearResponse.body as { stage: string | null }).stage).toBeNull();
    });

    it('rejects an invalid stage value', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      await request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .set('Cookie', cookie)
        .send({ stage: 'NOT_A_REAL_STAGE' })
        .expect(400);
    });

    it('rejects stage on lead creation', async () => {
      const { cookie } = await seedCustomer();

      await request(app.getHttpServer())
        .post('/api/leads')
        .set('Cookie', cookie)
        .send({ name: 'Lead', stage: 'LEAD' })
        .expect(400);
    });
  });

  describe('reminders', () => {
    it('supports full create/list/update/delete lifecycle', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);
      const triggerAt = new Date(Date.now() + 60_000).toISOString();

      const createResponse = await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reminders`)
        .set('Cookie', cookie)
        .send({ title: 'Call back', triggerAt })
        .expect(201);
      const reminder = createResponse.body as { id: string; status: string };
      expect(reminder.status).toBe('PENDING');

      const listResponse = await request(app.getHttpServer())
        .get(`/api/leads/${leadId}/reminders`)
        .set('Cookie', cookie)
        .expect(200);
      expect(
        (listResponse.body as Array<{ id: string }>).map((r) => r.id),
      ).toEqual([reminder.id]);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/leads/${leadId}/reminders/${reminder.id}`)
        .set('Cookie', cookie)
        .send({ status: 'DISMISSED' })
        .expect(200);
      expect((updateResponse.body as { status: string }).status).toBe(
        'DISMISSED',
      );

      await request(app.getHttpServer())
        .delete(`/api/leads/${leadId}/reminders/${reminder.id}`)
        .set('Cookie', cookie)
        .expect(200);

      const found = await prisma.leadReminder.findUnique({
        where: { id: reminder.id },
      });
      expect(found).toBeNull();
    });

    it('returns 400 when triggerAt is missing', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reminders`)
        .set('Cookie', cookie)
        .send({ title: 'Call back' })
        .expect(400);
    });

    it('returns 404 for a lead not owned by the caller', async () => {
      const { cookie: cookieA } = await seedCustomer();
      const { cookie: cookieB } = await seedCustomer();
      const leadId = await createLead(cookieA);

      await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reminders`)
        .set('Cookie', cookieB)
        .send({ title: 'Call back', triggerAt: new Date().toISOString() })
        .expect(404);
    });
  });

  describe('GET /api/reminders/due', () => {
    it('returns only overdue PENDING reminders by default', async () => {
      const { cookie } = await seedCustomer();
      const leadId = await createLead(cookie);

      const overdueResponse = await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reminders`)
        .set('Cookie', cookie)
        .send({
          title: 'Overdue',
          triggerAt: new Date(Date.now() - 60_000).toISOString(),
        })
        .expect(201);
      const overdue = overdueResponse.body as { id: string };

      await request(app.getHttpServer())
        .post(`/api/leads/${leadId}/reminders`)
        .set('Cookie', cookie)
        .send({
          title: 'Future',
          triggerAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        })
        .expect(201);

      const dueResponse = await request(app.getHttpServer())
        .get('/api/reminders/due')
        .set('Cookie', cookie)
        .expect(200);
      expect(
        (dueResponse.body as Array<{ id: string }>).map((r) => r.id),
      ).toEqual([overdue.id]);
    });

    it('extends the window with withinMinutes and excludes other customers', async () => {
      const { cookie: cookieA } = await seedCustomer();
      const { cookie: cookieB } = await seedCustomer();
      const leadA = await createLead(cookieA);
      const leadB = await createLead(cookieB);

      const soonResponse = await request(app.getHttpServer())
        .post(`/api/leads/${leadA}/reminders`)
        .set('Cookie', cookieA)
        .send({
          title: 'Soon',
          triggerAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        })
        .expect(201);
      const soon = soonResponse.body as { id: string };

      await request(app.getHttpServer())
        .post(`/api/leads/${leadB}/reminders`)
        .set('Cookie', cookieB)
        .send({
          title: "Other customer's overdue reminder",
          triggerAt: new Date(Date.now() - 60_000).toISOString(),
        })
        .expect(201);

      const withoutWindow = await request(app.getHttpServer())
        .get('/api/reminders/due')
        .set('Cookie', cookieA)
        .expect(200);
      expect(withoutWindow.body as Array<{ id: string }>).toHaveLength(0);

      const withWindow = await request(app.getHttpServer())
        .get('/api/reminders/due')
        .query({ withinMinutes: 60 })
        .set('Cookie', cookieA)
        .expect(200);
      expect(
        (withWindow.body as Array<{ id: string }>).map((r) => r.id),
      ).toEqual([soon.id]);
    });

    it('rejects an out-of-range withinMinutes', async () => {
      const { cookie } = await seedCustomer();

      await request(app.getHttpServer())
        .get('/api/reminders/due')
        .query({ withinMinutes: -1 })
        .set('Cookie', cookie)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/reminders/due')
        .query({ withinMinutes: 999999 })
        .set('Cookie', cookie)
        .expect(400);
    });

    it('rejects unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/api/reminders/due').expect(401);
    });
  });
});
