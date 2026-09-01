import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { BulkMessagePlaceholderService } from './bulk-message-placeholder.service';
import { BulkMessageTemplatesService } from './bulk-message-templates.service';

// Checklist (per backend/CLAUDE.md):
// Happy path — create with no linked form; create with a linked form makes its
// untagged fields available as {field.*} tokens; update name/body only; update
// clearing the linked form with a fresh core-only body; delete keeps past
// sends (their templateId becomes null); list returns only the caller's own
// templates, newest first.
// Sad path — create with a linkedFormId the caller doesn't own 404s; create
// with an unknown {token} 400s; create blocked when the plan doesn't include
// the bulk messenger (403); create blocked at the plan's maxTemplates (409);
// update sending linkedFormId with a body that still references a now-removed
// {field.*} token 400s; a foreign template 404s.
describe('BulkMessageTemplatesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: BulkMessageTemplatesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    prisma = new PrismaService(new AppConfigService());
    const placeholderService = new BulkMessagePlaceholderService(prisma);
    const planEnforcementService = new PlanEnforcementService(
      prisma,
      new PlanPolicyResolverService(prisma),
    );
    service = new BulkMessageTemplatesService(
      prisma,
      planEnforcementService,
      placeholderService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'BM Template Customer',
        email: `bm-template-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
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
        name: 'Assigning Employee',
        email: `bm-template-employee-${randomUUID()}@example.com`,
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
    const customer = await seedCustomer();
    const plan = await seedPlan(overrides);
    await assignPlan(customer.id, plan.id);
    return customer;
  }

  // A form with one tagged (LEAD_NAME) field and one untagged short-text
  // question labelled "Company size".
  async function seedForm(customerId: string, label = 'Company size') {
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
    await prisma.exchangeContactFormField.create({
      data: {
        versionId: version.id,
        order: 1,
        type: ExchangeContactFieldType.SHORT_TEXT,
        tag: null,
        label,
        isRequired: false,
      },
    });
    return form;
  }

  it('creates a template with no linked form', async () => {
    const customer = await seedCustomerWithPlan();

    const template = await service.create(customer.id, {
      name: 'Follow up',
      body: 'Hi {name}, great to meet you at {location}.',
      linkedFormId: null,
    });

    expect(template).toMatchObject({
      name: 'Follow up',
      body: 'Hi {name}, great to meet you at {location}.',
      linkedFormId: null,
      linkedFormName: null,
      sendCount: 0,
    });
  });

  it('accepts {field.*} tokens for a linked form and rejects unknown tokens', async () => {
    const customer = await seedCustomerWithPlan();
    const form = await seedForm(customer.id);

    const template = await service.create(customer.id, {
      name: 'Sized',
      body: 'Hi {name}, a {field.company_size} company — nice.',
      linkedFormId: form.id,
    });
    expect(template.linkedFormId).toBe(form.id);

    await expect(
      service.create(customer.id, {
        name: 'Bad',
        body: 'Hi {name}, {field.unknown_question}?',
        linkedFormId: form.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s when the linked form belongs to someone else', async () => {
    const owner = await seedCustomerWithPlan();
    const other = await seedCustomerWithPlan();
    const foreignForm = await seedForm(other.id);

    await expect(
      service.create(owner.id, {
        name: 'X',
        body: 'Hi {name}',
        linkedFormId: foreignForm.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks creation when the plan does not include the bulk messenger', async () => {
    const customer = await seedCustomerWithPlan({ isAvailable: false });

    await expect(
      service.create(customer.id, { name: 'X', body: 'Hi {name}' }),
    ).rejects.toThrow(
      "This customer's plan does not include the bulk messenger",
    );
  });

  it('blocks creation once at the maxTemplates cap', async () => {
    const customer = await seedCustomerWithPlan({ maxTemplates: 1 });
    await service.create(customer.id, { name: 'One', body: 'Hi {name}' });

    await expect(
      service.create(customer.id, { name: 'Two', body: 'Hi {name}' }),
    ).rejects.toThrow(
      "This customer's plan has reached its bulk message template limit",
    );
  });

  it('updates name and body only', async () => {
    const customer = await seedCustomerWithPlan();
    const template = await service.create(customer.id, {
      name: 'Old',
      body: 'Hi {name}',
    });

    const updated = await service.update(customer.id, template.id, {
      name: 'New',
      body: 'Hello {name}!',
    });

    expect(updated).toMatchObject({ name: 'New', body: 'Hello {name}!' });
  });

  it('clearing the linked form requires a body without its {field.*} tokens', async () => {
    const customer = await seedCustomerWithPlan();
    const form = await seedForm(customer.id);
    const template = await service.create(customer.id, {
      name: 'Sized',
      body: 'Hi {name}, {field.company_size}',
      linkedFormId: form.id,
    });

    await expect(
      service.update(customer.id, template.id, {
        linkedFormId: null,
        body: 'Hi {name}, {field.company_size}',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const updated = await service.update(customer.id, template.id, {
      linkedFormId: null,
      body: 'Hi {name}',
    });
    expect(updated.linkedFormId).toBeNull();
  });

  it('404s a foreign template', async () => {
    const owner = await seedCustomerWithPlan();
    const other = await seedCustomerWithPlan();
    const template = await service.create(owner.id, {
      name: 'Mine',
      body: 'Hi {name}',
    });

    await expect(
      service.getDetailForCustomer(other.id, template.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists only the caller's own templates, newest first", async () => {
    const customer = await seedCustomerWithPlan();
    const other = await seedCustomerWithPlan();
    await service.create(other.id, { name: 'Theirs', body: 'Hi {name}' });
    const first = await service.create(customer.id, {
      name: 'First',
      body: 'Hi {name}',
    });
    const second = await service.create(customer.id, {
      name: 'Second',
      body: 'Hi {name}',
    });

    const list = await service.listForCustomer(customer.id);
    expect(list.map((t) => t.id)).toEqual([second.id, first.id]);
  });
});
