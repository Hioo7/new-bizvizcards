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
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
  LeadSourceType,
  PlanBusinessModelType,
} from '../../src/generated/prisma/client';

// Checklist (per backend/CLAUDE.md):
// Happy path — a plan with the bulk messenger on lets a customer create a
// template, list it, read valid leads (a phoneless lead is flagged), create a
// send to the phone leads, see "0 of N messaged", mark one recipient, see the
// counter advance, then delete the send.
// Sad path — a customer whose plan has the bulk messenger off gets 403 on
// create and sees bulkMessenger.isAvailable=false on the effective policy;
// maxTemplates is enforced with 409; another customer gets 404 on every
// template/send route; a template whose linked form still has referencing
// templates blocks form deletion with 409; a send outlives its template and a
// deleted lead.
describe('Bulk Messenger (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededCustomerAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];

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
    if (seededCustomerAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededCustomerAccountIds } },
      });
      seededCustomerAccountIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.planPurchaseHistory.deleteMany({
        where: { planId: { in: seededPlanIds } },
      });
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer() {
    const email = `bm-e2e-${randomUUID()}@example.com`;
    const password = `Passw0rd-${randomUUID()}`;
    const signUp = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-up/email`)
      .send({ email, password, name: 'BM Customer' })
      .expect(200);
    const accountId = (signUp.body as { user: { id: string } }).user.id;
    seededCustomerAccountIds.push(accountId);

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

  async function seedPlan(
    overrides: { isAvailable?: boolean; maxTemplates?: number } = {},
  ) {
    const plan = await prisma.plan.create({
      data: {
        name: `BM Plan ${randomUUID()}`,
        price: 0,
        businessModelType: PlanBusinessModelType.ONE_TIME,
        policy: {
          create: {
            ecardPolicy: { create: { isAvailable: true, maxEcards: 0 } },
            smartCardPolicy: {
              create: { isAvailable: true, maxSmartCards: 0 },
            },
            organisationPolicy: {
              create: {
                isAvailable: true,
                maxOrgsCanJoin: 0,
                maxOrgsCanCreate: 0,
                orgEcardPolicy: { create: { isAvailable: true, maxEcards: 0 } },
                orgSmartCardPolicy: {
                  create: { isAvailable: true, maxSmartCards: 0 },
                },
              },
            },
            eventPolicy: {
              create: { isAvailable: true, maxEvents: 0, maxGuestsPerEvent: 0 },
            },
            emailSignaturePolicy: {
              create: { isAvailable: true, maxEmailSignatures: 0 },
            },
            virtualBackgroundPolicy: {
              create: {
                isAvailable: false,
                maxVirtualBackgrounds: 0,
                allowCustomBackground: false,
              },
            },
            bulkMessengerPolicy: {
              create: {
                isAvailable: overrides.isAvailable ?? true,
                maxTemplates: overrides.maxTemplates ?? 10,
              },
            },
          },
        },
      },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  async function assignPlan(customerId: string, planId: string) {
    const employeeAccount = await prisma.employeeAccount.create({
      data: {
        name: 'Assigner',
        email: `bm-e2e-emp-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(employeeAccount.id);
    const employee = await prisma.employee.create({
      data: { accountId: employeeAccount.id },
    });
    await prisma.customer.update({
      where: { id: customerId },
      data: { currentPlanId: planId },
    });
    await prisma.planPurchaseHistory.create({
      data: {
        customerId,
        planId,
        assignedByEmployeeId: employee.id,
        expiresAt: null,
        businessModelTypeAtPurchase: PlanBusinessModelType.ONE_TIME,
      },
    });
  }

  async function seedCustomerWithPlan(
    overrides: { isAvailable?: boolean; maxTemplates?: number } = {},
  ) {
    const { customer, cookie } = await seedCustomer();
    const plan = await seedPlan(overrides);
    await assignPlan(customer.id, plan.id);
    return { customer, cookie };
  }

  async function seedLead(
    customerId: string,
    overrides: Partial<{ name: string; phoneNumber: string | null }> = {},
  ) {
    return prisma.lead.create({
      data: {
        customerId,
        sourcedBy: LeadSourceType.MANUAL_ENTRY,
        name: overrides.name ?? 'Lead',
        countryDialCode: '+1',
        phoneNumber:
          overrides.phoneNumber === undefined
            ? '2025550000'
            : overrides.phoneNumber,
      },
    });
  }

  async function seedForm(customerId: string) {
    const form = await prisma.exchangeContactForm.create({
      data: { customerId, name: `Form ${randomUUID()}` },
    });
    const version = await prisma.exchangeContactFormVersion.create({
      data: { formId: form.id, versionNumber: 1, isCurrent: true },
    });
    await prisma.exchangeContactFormField.create({
      data: {
        versionId: version.id,
        order: 0,
        type: ExchangeContactFieldType.SHORT_TEXT,
        tag: ExchangeContactFieldTag.LEAD_NAME,
        label: 'Name',
        isRequired: true,
      },
    });
    return form;
  }

  it('runs the full happy path', async () => {
    const { customer, cookie } = await seedCustomerWithPlan({
      maxTemplates: 5,
    });
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .send({ name: 'Follow up', body: 'Hi {name}!' })
      .expect(201);
    const templateId = (created.body as { id: string }).id;

    const list = await request(server)
      .get('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .expect(200);
    expect((list.body as { id: string }[]).map((t) => t.id)).toContain(
      templateId,
    );

    const withPhoneA = await seedLead(customer.id, { name: 'A' });
    const withPhoneB = await seedLead(customer.id, { name: 'B' });
    await seedLead(customer.id, { name: 'No phone', phoneNumber: null });

    const validLeads = await request(server)
      .get(`/api/bulk-messenger/templates/${templateId}/valid-leads`)
      .set('Cookie', cookie)
      .expect(200);
    const rows = validLeads.body as {
      leadId: string;
      hasUsablePhone: boolean;
    }[];
    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => !r.hasUsablePhone)).toHaveLength(1);

    const send = await request(server)
      .post('/api/bulk-messenger/sends')
      .set('Cookie', cookie)
      .send({ templateId, leadIds: [withPhoneA.id, withPhoneB.id] })
      .expect(201);
    const sendBody = send.body as {
      id: string;
      totalRecipients: number;
      messagedCount: number;
      pendingCount: number;
      recipients: { id: string }[];
    };
    expect(sendBody.totalRecipients).toBe(2);
    expect(sendBody.messagedCount).toBe(0);
    expect(sendBody.pendingCount).toBe(2);

    await request(server)
      .patch(
        `/api/bulk-messenger/sends/${sendBody.id}/recipients/${sendBody.recipients[0].id}`,
      )
      .set('Cookie', cookie)
      .expect(200);

    const afterMark = await request(server)
      .get(`/api/bulk-messenger/sends/${sendBody.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect((afterMark.body as { messagedCount: number }).messagedCount).toBe(1);

    await request(server)
      .delete(`/api/bulk-messenger/sends/${sendBody.id}`)
      .set('Cookie', cookie)
      .expect(200);
    await request(server)
      .get(`/api/bulk-messenger/sends/${sendBody.id}`)
      .set('Cookie', cookie)
      .expect(404);
  });

  it('gates creation by plan and reports availability on the effective policy', async () => {
    const { cookie } = await seedCustomerWithPlan({
      isAvailable: false,
      maxTemplates: 0,
    });
    const server = app.getHttpServer();

    await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .send({ name: 'X', body: 'Hi {name}' })
      .expect(403);

    const policy = await request(server)
      .get('/api/customer/plan/effective-policy')
      .set('Cookie', cookie)
      .expect(200);
    expect((policy.body as { bulkMessenger: unknown }).bulkMessenger).toEqual({
      isAvailable: false,
      maxTemplates: 0,
    });
  });

  it('enforces maxTemplates with 409', async () => {
    const { cookie } = await seedCustomerWithPlan({ maxTemplates: 1 });
    const server = app.getHttpServer();

    await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .send({ name: 'One', body: 'Hi {name}' })
      .expect(201);
    await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .send({ name: 'Two', body: 'Hi {name}' })
      .expect(409);
  });

  it('404s another customer on template and send routes', async () => {
    const a = await seedCustomerWithPlan();
    const b = await seedCustomerWithPlan();
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', a.cookie)
      .send({ name: 'Mine', body: 'Hi {name}' })
      .expect(201);
    const templateId = (created.body as { id: string }).id;

    await request(server)
      .get(`/api/bulk-messenger/templates/${templateId}`)
      .set('Cookie', b.cookie)
      .expect(404);
    await request(server)
      .patch(`/api/bulk-messenger/templates/${templateId}`)
      .set('Cookie', b.cookie)
      .send({ name: 'Hijack' })
      .expect(404);
    await request(server)
      .delete(`/api/bulk-messenger/templates/${templateId}`)
      .set('Cookie', b.cookie)
      .expect(404);
  });

  it('blocks deleting a form that a template still depends on', async () => {
    const { customer, cookie } = await seedCustomerWithPlan();
    const server = app.getHttpServer();
    const form = await seedForm(customer.id);

    const created = await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .send({ name: 'Linked', body: 'Hi {name}', linkedFormId: form.id })
      .expect(201);
    const templateId = (created.body as { id: string }).id;

    await request(server)
      .delete(`/api/exchange-contact-forms/me/${form.id}`)
      .set('Cookie', cookie)
      .expect(409);

    await request(server)
      .delete(`/api/bulk-messenger/templates/${templateId}`)
      .set('Cookie', cookie)
      .expect(200);
    await request(server)
      .delete(`/api/exchange-contact-forms/me/${form.id}`)
      .set('Cookie', cookie)
      .expect(200);
  });

  it('keeps a send after its template and a recipient lead are deleted', async () => {
    const { customer, cookie } = await seedCustomerWithPlan();
    const server = app.getHttpServer();
    const lead = await seedLead(customer.id, { name: 'Keeper' });

    const created = await request(server)
      .post('/api/bulk-messenger/templates')
      .set('Cookie', cookie)
      .send({ name: 'Doomed', body: 'Hi {name}' })
      .expect(201);
    const templateId = (created.body as { id: string }).id;

    const send = await request(server)
      .post('/api/bulk-messenger/sends')
      .set('Cookie', cookie)
      .send({ templateId, leadIds: [lead.id] })
      .expect(201);
    const sendId = (send.body as { id: string }).id;

    await request(server)
      .delete(`/api/bulk-messenger/templates/${templateId}`)
      .set('Cookie', cookie)
      .expect(200);
    await prisma.lead.delete({ where: { id: lead.id } });

    const detail = await request(server)
      .get(`/api/bulk-messenger/sends/${sendId}`)
      .set('Cookie', cookie)
      .expect(200);
    const body = detail.body as {
      templateNameSnapshot: string;
      recipients: { leadId: string | null; recipientNameSnapshot: string }[];
    };
    expect(body.templateNameSnapshot).toBe('Doomed');
    expect(body.recipients[0].leadId).toBeNull();
    expect(body.recipients[0].recipientNameSnapshot).toBe('Keeper');
  });
});
