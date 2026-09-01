import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardComponentType,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { ExchangeContactFormResolutionService } from './exchange-contact-form-resolution.service';
import { ExchangeContactFormsService } from './exchange-contact-forms.service';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';

// Checklist (enumerated before writing cases, per backend/CLAUDE.md):
// Happy path — org template wins when present and the org's own policy
// allows it; falls through to the card's own linked form when there's no
// template (or the org denies it); linked form gated by the card's
// (org-boosted) effective policy.
// Sad path — org template present but org policy denies -> falls through to
// linked form, not null; linked form present but policy denies -> null
// (silent degrade, not thrown); neither template nor linked form -> null;
// org has no resolvable creator -> falls through, same as policy denial.
describe('ExchangeContactFormResolutionService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let resolutionService: ExchangeContactFormResolutionService;
  let formsService: ExchangeContactFormsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const policyResolver = new PlanPolicyResolverService(prisma);
    const planEnforcementService = new PlanEnforcementService(
      prisma,
      policyResolver,
    );
    resolutionService = new ExchangeContactFormResolutionService(
      prisma,
      policyResolver,
    );
    formsService = new ExchangeContactFormsService(
      prisma,
      planEnforcementService,
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
    if (seededOrganisationIds.length > 0) {
      await prisma.organisation.deleteMany({
        where: { id: { in: seededOrganisationIds } },
      });
      seededOrganisationIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `resolution-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedPlan(
    overrides: {
      customFormIsAvailable?: boolean;
      orgCustomFormIsAvailable?: boolean;
    } = {},
  ) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${randomUUID()}`,
        price: 0,
        businessModelType: PlanBusinessModelType.ONE_TIME,
        policy: {
          create: {
            ecardPolicy: {
              create: {
                isAvailable: true,
                maxEcards: 10,
                exchangeContactAccess: true,
                isCustomFormAvailable: overrides.customFormIsAvailable ?? true,
                maxCustomForms: 5,
                componentAvailabilities: {
                  create: Object.values(ECardComponentType).map((type) => ({
                    type,
                    isAvailable: true,
                  })),
                },
              },
            },
            smartCardPolicy: {
              create: { isAvailable: true, maxSmartCards: 0 },
            },
            organisationPolicy: {
              create: {
                isAvailable: true,
                maxOrgsCanJoin: 0,
                maxOrgsCanCreate: 0,
                orgEcardPolicy: {
                  create: {
                    isAvailable: true,
                    maxEcards: 0,
                    isCustomFormAvailable:
                      overrides.orgCustomFormIsAvailable ?? false,
                    componentAvailabilities: {
                      create: Object.values(ECardComponentType).map((type) => ({
                        type,
                        isAvailable: true,
                      })),
                    },
                  },
                },
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
              create: { isAvailable: false, maxTemplates: 0 },
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
        email: `resolution-employee-${randomUUID()}@example.com`,
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
    overrides: { customFormIsAvailable?: boolean } = {},
  ) {
    const customer = await seedCustomer();
    const plan = await seedPlan(overrides);
    await assignPlan(customer.id, plan.id);
    return customer;
  }

  const nameField = {
    type: 'SHORT_TEXT' as const,
    tag: 'LEAD_NAME' as const,
    label: 'Name',
    isRequired: true,
  };

  it('returns null when the card has no organisation and no linked form', async () => {
    const customer = await seedCustomerWithPlan();

    const result = await resolutionService.resolveForCard({
      customerId: customer.id,
      organisationId: null,
      customFormId: null,
    });

    expect(result).toBeNull();
  });

  it("returns the card's own linked form when the effective policy allows it", async () => {
    const customer = await seedCustomerWithPlan({
      customFormIsAvailable: true,
    });
    const form = await formsService.create({
      customerId: customer.id,
      name: 'My Form',
      fields: [nameField],
    });

    const result = await resolutionService.resolveForCard({
      customerId: customer.id,
      organisationId: null,
      customFormId: form.id,
    });

    expect(result?.id).toBe(form.id);
    expect(result?.versionId).toBe(form.currentVersion.id);
    expect(result?.fields).toHaveLength(1);
  });

  it('silently returns null (does not throw) when the linked form’s plan access has since been denied', async () => {
    const customer = await seedCustomerWithPlan({
      customFormIsAvailable: true,
    });
    const form = await formsService.create({
      customerId: customer.id,
      name: 'My Form',
      fields: [nameField],
    });
    const deniedPlan = await seedPlan({ customFormIsAvailable: false });
    await assignPlan(customer.id, deniedPlan.id);

    const result = await resolutionService.resolveForCard({
      customerId: customer.id,
      organisationId: null,
      customFormId: form.id,
    });

    expect(result).toBeNull();
  });

  it("the organisation's template wins over the card's own linked form when the org's policy allows it", async () => {
    const creator = await seedCustomer('Creator');
    const creatorPlan = await seedPlan({ orgCustomFormIsAvailable: true });
    await assignPlan(creator.id, creatorPlan.id);
    const organisation = await prisma.organisation.create({
      data: { name: 'Acme', createdByCustomerId: creator.id },
    });
    seededOrganisationIds.push(organisation.id);
    const template = await formsService.upsertForOrganisation(organisation.id, {
      name: 'Org Template',
      fields: [nameField],
    });

    const customer = await seedCustomerWithPlan({
      customFormIsAvailable: true,
    });
    const ownForm = await formsService.create({
      customerId: customer.id,
      name: 'My Own Form',
      fields: [nameField],
    });

    const result = await resolutionService.resolveForCard({
      customerId: customer.id,
      organisationId: organisation.id,
      customFormId: ownForm.id,
    });

    expect(result?.id).toBe(template.form.id);
  });

  it("falls through to the card's own linked form when the org has a template but its policy denies access", async () => {
    const creator = await seedCustomer('Creator');
    const creatorPlan = await seedPlan({ orgCustomFormIsAvailable: true });
    await assignPlan(creator.id, creatorPlan.id);
    const organisation = await prisma.organisation.create({
      data: { name: 'Acme', createdByCustomerId: creator.id },
    });
    seededOrganisationIds.push(organisation.id);
    await formsService.upsertForOrganisation(organisation.id, {
      name: 'Org Template',
      fields: [nameField],
    });
    // Revoke the org's access after the template already exists — the
    // template itself isn't deleted, just no longer allowed to render.
    const deniedCreatorPlan = await seedPlan({
      orgCustomFormIsAvailable: false,
    });
    await assignPlan(creator.id, deniedCreatorPlan.id);

    const customer = await seedCustomerWithPlan({
      customFormIsAvailable: true,
    });
    const ownForm = await formsService.create({
      customerId: customer.id,
      name: 'My Own Form',
      fields: [nameField],
    });

    const result = await resolutionService.resolveForCard({
      customerId: customer.id,
      organisationId: organisation.id,
      customFormId: ownForm.id,
    });

    expect(result?.id).toBe(ownForm.id);
  });

  it('falls through to the linked form when the organisation has no template at all', async () => {
    const organisation = await prisma.organisation.create({
      data: { name: 'No Template Org' },
    });
    seededOrganisationIds.push(organisation.id);

    const customer = await seedCustomerWithPlan({
      customFormIsAvailable: true,
    });
    const ownForm = await formsService.create({
      customerId: customer.id,
      name: 'My Own Form',
      fields: [nameField],
    });

    const result = await resolutionService.resolveForCard({
      customerId: customer.id,
      organisationId: organisation.id,
      customFormId: ownForm.id,
    });

    expect(result?.id).toBe(ownForm.id);
  });
});
