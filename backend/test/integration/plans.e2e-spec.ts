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
  EMPLOYEE_AUTH,
  EMPLOYEE_AUTH_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { CustomerAuth } from '../../src/common/auth/customer-auth.factory';
import type { EmployeeAuth } from '../../src/common/auth/employee-auth.factory';
import { NodemailerOtpSender } from '../../src/common/auth/otp-sender/nodemailer-otp-sender.service';
import { EMPLOYEE_ROLE } from '../../src/common/constants/roles.constants';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import {
  ECardComponentType,
  SmartCardTemplateKey,
} from '../../src/generated/prisma/client';
import type { CustomerModel } from '../../src/generated/prisma/models';

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

function ecardComponentAvailabilities(
  overrides: Partial<Record<ECardComponentType, boolean>> = {},
) {
  return Object.values(ECardComponentType).map((type) => ({
    type,
    isAvailable: overrides[type] ?? true,
    ...(type === ECardComponentType.GALLERY && {
      galleryLimits: {
        maxGalleries: 10,
        maxImagesPerGallery: 10,
        maxGallerySizeBytes: 10 * 1024 * 1024,
      },
    }),
  }));
}

function ecardPolicyPayload(
  overrides: Partial<{
    isAvailable: boolean;
    maxEcards: number;
    exchangeContactAccess: boolean;
    components: Partial<Record<ECardComponentType, boolean>>;
  }> = {},
) {
  return {
    isAvailable: overrides.isAvailable ?? true,
    maxEcards: overrides.maxEcards ?? 5,
    exchangeContactAccess: overrides.exchangeContactAccess ?? true,
    componentAvailabilities: ecardComponentAvailabilities(
      overrides.components ?? {},
    ),
  };
}

function smartCardPolicyPayload(
  overrides: Partial<{
    isAvailable: boolean;
    maxSmartCards: number;
    exchangeContactAccess: boolean;
    whitelistedTemplateIds: string[];
  }> = {},
) {
  return {
    isAvailable: overrides.isAvailable ?? true,
    maxSmartCards: overrides.maxSmartCards ?? 5,
    exchangeContactAccess: overrides.exchangeContactAccess ?? true,
    whitelistedTemplateIds: overrides.whitelistedTemplateIds ?? [],
  };
}

function organisationPolicyPayload(
  overrides: Partial<{
    isAvailable: boolean;
    maxOrgsCanJoin: number;
    maxOrgsCanCreate: number;
    orgEcardPolicy: ReturnType<typeof ecardPolicyPayload>;
    orgSmartCardPolicy: ReturnType<typeof smartCardPolicyPayload>;
  }> = {},
) {
  return {
    isAvailable: overrides.isAvailable ?? true,
    maxOrgsCanJoin: overrides.maxOrgsCanJoin ?? 3,
    maxOrgsCanCreate: overrides.maxOrgsCanCreate ?? 3,
    orgEcardPolicy: overrides.orgEcardPolicy ?? ecardPolicyPayload(),
    orgSmartCardPolicy:
      overrides.orgSmartCardPolicy ?? smartCardPolicyPayload(),
  };
}

function eventPolicyPayload(
  overrides: Partial<{
    isAvailable: boolean;
    maxEvents: number;
    maxGuestsPerEvent: number;
  }> = {},
) {
  return {
    isAvailable: overrides.isAvailable ?? true,
    maxEvents: overrides.maxEvents ?? 3,
    maxGuestsPerEvent: overrides.maxGuestsPerEvent ?? 20,
  };
}

function createPlanPayload(
  overrides: Partial<{
    name: string;
    price: number;
    businessModelType: 'ONE_TIME' | 'SUBSCRIPTION' | 'TRIAL';
    subscriptionDurationMonths: number;
    ecardPolicy: ReturnType<typeof ecardPolicyPayload>;
    smartCardPolicy: ReturnType<typeof smartCardPolicyPayload>;
    organisationPolicy: ReturnType<typeof organisationPolicyPayload>;
    eventPolicy: ReturnType<typeof eventPolicyPayload>;
  }> = {},
) {
  return {
    name: overrides.name ?? `Test Plan ${randomUUID()}`,
    price: overrides.price ?? 0,
    businessModelType: overrides.businessModelType ?? 'ONE_TIME',
    ...(overrides.businessModelType === 'SUBSCRIPTION' && {
      subscriptionDurationMonths: overrides.subscriptionDurationMonths ?? 1,
    }),
    isPublic: false,
    ecardPolicy: overrides.ecardPolicy ?? ecardPolicyPayload(),
    smartCardPolicy: overrides.smartCardPolicy ?? smartCardPolicyPayload(),
    organisationPolicy:
      overrides.organisationPolicy ?? organisationPolicyPayload(),
    eventPolicy: overrides.eventPolicy ?? eventPolicyPayload(),
  };
}

describe('Plans & plan enforcement (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let fakeOtpSender: FakeOtpSender;
  let originalDatabaseUrl: string | undefined;
  const seededCustomerAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];
  const seededOrganisationIds: string[] = [];
  const seededEcardIds: string[] = [];
  const seededSmartCardIds: string[] = [];

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
    const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.all(
      `${EMPLOYEE_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(employeeAuth),
    );
    httpAdapter.all(
      `${CUSTOMER_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(customerAuth),
    );
    app.use(express.json());
    app.useGlobalFilters(new BetterAuthApiErrorFilter());

    await app.init();
    prisma = app.get(PrismaService);

    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededSmartCardIds.length > 0) {
      await prisma.smartCard.deleteMany({
        where: { id: { in: seededSmartCardIds } },
      });
      seededSmartCardIds.length = 0;
    }
    if (seededEcardIds.length > 0) {
      await prisma.eCard.deleteMany({
        where: { id: { in: seededEcardIds } },
      });
      seededEcardIds.length = 0;
    }
    if (seededOrganisationIds.length > 0) {
      await prisma.organisation.deleteMany({
        where: { id: { in: seededOrganisationIds } },
      });
      seededOrganisationIds.length = 0;
    }
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
      // Purchase history rows FK-restrict plan deletion — clear them first.
      await prisma.planPurchaseHistory.deleteMany({
        where: { planId: { in: seededPlanIds } },
      });
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedEmployee(
    role: string = EMPLOYEE_ROLE.EMPLOYEE,
  ): Promise<{ accountId: string; employeeId: string; cookie: string }> {
    const email = `plans-e2e-employee-${randomUUID()}@example.com`;
    const account = await prisma.employeeAccount.create({
      data: { name: 'Test Employee', email, emailVerified: true, role },
    });
    seededEmployeeAccountIds.push(account.id);
    const employee = await prisma.employee.create({
      data: { accountId: account.id },
    });

    await request(app.getHttpServer())
      .post(`${EMPLOYEE_AUTH_BASE_PATH}/email-otp/send-verification-otp`)
      .send({ email, type: 'sign-in' })
      .expect(200);
    const otp = fakeOtpSender.otpFor(email);
    const signInResponse = await request(app.getHttpServer())
      .post(`${EMPLOYEE_AUTH_BASE_PATH}/sign-in/email-otp`)
      .send({ email, otp })
      .expect(200);
    const setCookie = signInResponse.headers[
      'set-cookie'
    ] as unknown as string[];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    return { accountId: account.id, employeeId: employee.id, cookie };
  }

  async function seedCustomer(): Promise<{
    customer: CustomerModel;
    cookie: string;
  }> {
    const email = `plans-e2e-customer-${randomUUID()}@example.com`;
    const password = `Passw0rd-${randomUUID()}`;

    const signUpResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-up/email`)
      .send({ email, password, name: 'Test Customer' })
      .expect(200);
    const accountId = (signUpResponse.body as { user: { id: string } }).user.id;
    seededCustomerAccountIds.push(accountId);

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

  async function createPlanViaHttp(
    employeeCookie: string,
    overrides: Parameters<typeof createPlanPayload>[0] = {},
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/employee/plans')
      .set('Cookie', employeeCookie)
      .send(createPlanPayload(overrides))
      .expect(201);
    const id = (response.body as { id: string }).id;
    seededPlanIds.push(id);
    return id;
  }

  async function seedEcard(
    customerId: string,
    organisationId: string | null = null,
  ) {
    const card = await prisma.eCard.create({
      data: {
        customerId,
        organisationId,
        endpoint: `plans-e2e-${randomUUID()}`,
        heroName: 'Test Hero',
        heroEmail: `plans-e2e-hero-${randomUUID()}@example.com`,
      },
    });
    seededEcardIds.push(card.id);
    return card;
  }

  describe('Plan CRUD + RBAC', () => {
    it('lets any employee create a plan with a full policy tree', async () => {
      const employee = await seedEmployee(EMPLOYEE_ROLE.EMPLOYEE);

      const response = await request(app.getHttpServer())
        .post('/api/employee/plans')
        .set('Cookie', employee.cookie)
        .send(createPlanPayload({ name: 'Starter' }))
        .expect(201);

      const body = response.body as {
        id: string;
        name: string;
        ecardPolicy: { maxEcards: number };
      };
      seededPlanIds.push(body.id);
      expect(body.name).toBe('Starter');
      expect(body.ecardPolicy.maxEcards).toBe(5);
    });

    it('denies a plain employee from deleting a plan, but allows an admin', async () => {
      const employee = await seedEmployee(EMPLOYEE_ROLE.EMPLOYEE);
      const admin = await seedEmployee(EMPLOYEE_ROLE.ADMIN);
      const planId = await createPlanViaHttp(employee.cookie);

      await request(app.getHttpServer())
        .delete(`/api/employee/plans/${planId}`)
        .set('Cookie', employee.cookie)
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/employee/plans/${planId}`)
        .set('Cookie', admin.cookie)
        .expect(200);

      seededPlanIds.splice(seededPlanIds.indexOf(planId), 1);
    });
  });

  describe('Plan delete guard', () => {
    it('blocks deleting a plan that has purchase history, and allows deleting a true orphan', async () => {
      const admin = await seedEmployee(EMPLOYEE_ROLE.ADMIN);
      const { customer } = await seedCustomer();
      const inUsePlanId = await createPlanViaHttp(admin.cookie);
      const orphanPlanId = await createPlanViaHttp(admin.cookie);

      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', admin.cookie)
        .send({ planId: inUsePlanId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/employee/plans/${inUsePlanId}`)
        .set('Cookie', admin.cookie)
        .expect(409);

      await request(app.getHttpServer())
        .delete(`/api/employee/plans/${orphanPlanId}`)
        .set('Cookie', admin.cookie)
        .expect(200);
      seededPlanIds.splice(seededPlanIds.indexOf(orphanPlanId), 1);
    });
  });

  describe('Assign / switch / renew / cancel + effective policy', () => {
    it('assigns a plan to a customer and surfaces it via the customer effective-policy endpoint', async () => {
      const employee = await seedEmployee();
      const { customer, cookie } = await seedCustomer();
      const planId = await createPlanViaHttp(employee.cookie, {
        name: 'Effective Policy Plan',
        ecardPolicy: ecardPolicyPayload({ maxEcards: 42 }),
      });

      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/customer/plan/effective-policy')
        .set('Cookie', cookie)
        .expect(200);

      const body = response.body as {
        planId: string;
        isFallback: boolean;
        ecard: { maxEcards: number };
        leadsViewAccess: boolean;
      };
      expect(body.planId).toBe(planId);
      expect(body.isFallback).toBe(false);
      expect(body.ecard.maxEcards).toBe(42);
      expect(typeof body.leadsViewAccess).toBe('boolean');
    });

    it('blocks assigning the same TRIAL plan to a customer twice, even after cancelling in between', async () => {
      const employee = await seedEmployee();
      const { customer } = await seedCustomer();
      const trialPlanId = await createPlanViaHttp(employee.cookie, {
        businessModelType: 'TRIAL',
      });

      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId: trialPlanId })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/cancel`)
        .set('Cookie', employee.cookie)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId: trialPlanId })
        .expect(409);
    });

    it('falls back to the system fallback plan once the active plan has lazily expired (no cron involved)', async () => {
      const employee = await seedEmployee();
      const { customer, cookie } = await seedCustomer();
      const planId = await createPlanViaHttp(employee.cookie, {
        businessModelType: 'SUBSCRIPTION',
        subscriptionDurationMonths: 1,
      });

      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId })
        .expect(201);

      // Simulate the passage of time purely by rewriting the history row's
      // expiresAt into the past — resolution is computed live, no worker.
      await prisma.planPurchaseHistory.updateMany({
        where: { customerId: customer.id, planId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const response = await request(app.getHttpServer())
        .get('/api/customer/plan/effective-policy')
        .set('Cookie', cookie)
        .expect(200);

      expect((response.body as { isFallback: boolean }).isFallback).toBe(true);
    });
  });

  describe('Public e-card gating', () => {
    it('404s the whole public page when the effective e-card policy is unavailable', async () => {
      const employee = await seedEmployee();
      const { customer } = await seedCustomer();
      const planId = await createPlanViaHttp(employee.cookie, {
        ecardPolicy: ecardPolicyPayload({ isAvailable: false }),
      });
      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId })
        .expect(201);
      const card = await seedEcard(customer.id);

      await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}`)
        .expect(404);
    });

    it('omits a component the live plan policy currently disallows, with no card mutation involved', async () => {
      const employee = await seedEmployee();
      const { customer } = await seedCustomer();
      const planId = await createPlanViaHttp(employee.cookie, {
        ecardPolicy: ecardPolicyPayload({
          components: { [ECardComponentType.WHATSAPP]: false },
        }),
      });
      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId })
        .expect(201);
      const card = await seedEcard(customer.id);
      await prisma.eCardComponent.create({
        data: {
          ecardId: card.id,
          type: ECardComponentType.WHATSAPP,
          order: 0,
          whatsapp: {
            create: {
              phoneCountryDialCode: '91',
              phoneNumber: '9876543210',
            },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}`)
        .expect(200);

      const body = response.body as {
        card: { components: Array<{ type: string }> };
      };
      expect(body.card.components.some((c) => c.type === 'WHATSAPP')).toBe(
        false,
      );
    });
  });

  describe('Public smart-card gating', () => {
    async function seedSmartCard(customerId: string | null) {
      const template = await prisma.smartCardTemplate.findFirstOrThrow();
      const card = await prisma.smartCard.create({
        data: {
          templateId: template.id,
          endpoint: `plans-e2e-sc-${randomUUID()}`,
          customerId,
        },
      });
      seededSmartCardIds.push(card.id);
      return card;
    }

    it('404s a claimed smart card whose effective policy is unavailable', async () => {
      const employee = await seedEmployee();
      const { customer } = await seedCustomer();
      const planId = await createPlanViaHttp(employee.cookie, {
        smartCardPolicy: smartCardPolicyPayload({ isAvailable: false }),
      });
      await request(app.getHttpServer())
        .post(`/api/employee/customers/${customer.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId })
        .expect(201);
      const card = await seedSmartCard(customer.id);

      await request(app.getHttpServer())
        .get(`/api/public/smart-cards/${card.endpoint}`)
        .expect(404);
    });

    it('is fully exempt from plan enforcement when the smart card is unclaimed', async () => {
      const card = await seedSmartCard(null);

      await request(app.getHttpServer())
        .get(`/api/public/smart-cards/${card.endpoint}`)
        .expect(200);
    });
  });

  describe('Organisation-linked e-card boost', () => {
    it("boosts a linked e-card from the org creator's own orgEcardPolicy, additively, and the boost disappears on unlink", async () => {
      const employee = await seedEmployee();
      const { customer: creator } = await seedCustomer();
      const { customer: member } = await seedCustomer();

      const creatorPlanId = await createPlanViaHttp(employee.cookie, {
        name: 'Org Creator Plan',
        ecardPolicy: ecardPolicyPayload({
          components: { [ECardComponentType.WHATSAPP]: false },
        }),
        organisationPolicy: organisationPolicyPayload({
          orgEcardPolicy: ecardPolicyPayload({
            components: { [ECardComponentType.WHATSAPP]: true },
          }),
        }),
      });
      await request(app.getHttpServer())
        .post(`/api/employee/customers/${creator.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId: creatorPlanId })
        .expect(201);

      const memberPlanId = await createPlanViaHttp(employee.cookie, {
        name: 'Member Personal Plan',
        ecardPolicy: ecardPolicyPayload({
          components: { [ECardComponentType.WHATSAPP]: false },
        }),
      });
      await request(app.getHttpServer())
        .post(`/api/employee/customers/${member.id}/plan/assign`)
        .set('Cookie', employee.cookie)
        .send({ planId: memberPlanId })
        .expect(201);

      const organisation = await prisma.organisation.create({
        data: { name: 'Acme Inc', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const card = await seedEcard(member.id, organisation.id);
      await prisma.eCardComponent.create({
        data: {
          ecardId: card.id,
          type: ECardComponentType.WHATSAPP,
          order: 0,
          whatsapp: {
            create: {
              phoneCountryDialCode: '91',
              phoneNumber: '9876543210',
            },
          },
        },
      });

      const linkedResponse = await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}`)
        .expect(200);
      const linkedBody = linkedResponse.body as {
        card: { components: Array<{ type: string }> };
      };
      expect(
        linkedBody.card.components.some((c) => c.type === 'WHATSAPP'),
      ).toBe(true);

      await prisma.eCard.update({
        where: { id: card.id },
        data: { organisationId: null },
      });

      const unlinkedResponse = await request(app.getHttpServer())
        .get(`/api/public/ecards/${card.endpoint}`)
        .expect(200);
      const unlinkedBody = unlinkedResponse.body as {
        card: { components: Array<{ type: string }> };
      };
      expect(
        unlinkedBody.card.components.some((c) => c.type === 'WHATSAPP'),
      ).toBe(false);
    });
  });
});
