import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardComponentType,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import type { ExchangeContactFormFieldDto } from '../dto/exchange-contact-form-field.dto';
import { ExchangeContactFormsService } from './exchange-contact-forms.service';

// Checklist (enumerated before writing cases, per backend/CLAUDE.md):
// Happy path — create persists version 1 with fields/tags/options; update
// with zero submissions mutates in place; update with submissions forks a
// new version and leaves the old one's fields untouched; listVersions
// reports submission counts; deleteVersion/deleteForm succeed when
// submission-free; setLinkedEcards links/unlinks a full target set.
// Sad path — create blocked by plan availability/limit; not-found on an
// unknown formId for every read/write method; deleteVersion blocked on the
// current version or one with submissions; deleteForm blocked when any
// version has submissions; setLinkedEcards rejects a foreign e-card and
// rejects the whole batch when any card's plan denies access.
// Organisation template — happy path: upsert creates on first call and
// versions (mutate/fork) on subsequent calls exactly like a customer form;
// delete no-ops when absent. Sad path: upsert fails closed when the org's
// resolved policy denies access, and when the org has no resolvable creator.
describe('ExchangeContactFormsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let planEnforcementService: PlanEnforcementService;
  let service: ExchangeContactFormsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededOrganisationIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    planEnforcementService = new PlanEnforcementService(
      prisma,
      new PlanPolicyResolverService(prisma),
    );
    service = new ExchangeContactFormsService(prisma, planEnforcementService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      // Cascades: CustomerAccount -> Customer -> ECard/ExchangeContactForm
      // (-> Version -> Field -> Option), -> Lead (-> ExchangeContactFormSubmission
      // -> Answer), and -> PlanPurchaseHistory, all the way down, per each
      // model's onDelete: Cascade. Must run before both employeeAccount
      // cleanup (PlanPurchaseHistory.assignedByEmployeeId is onDelete:
      // Restrict) and organisation cleanup below (an org-owned form's
      // version can carry a submission whose Lead belongs to some other,
      // unrelated seeded customer — that submission's Restrict-guarded FK to
      // its version must be gone before the org->form->version cascade runs).
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
        email: `exchange-contact-forms-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedPlan(
    overrides: {
      customFormIsAvailable?: boolean;
      maxCustomForms?: number;
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
                maxCustomForms: overrides.maxCustomForms ?? 5,
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
        email: `exchange-contact-forms-employee-${randomUUID()}@example.com`,
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
    overrides: {
      customFormIsAvailable?: boolean;
      maxCustomForms?: number;
    } = {},
  ) {
    const customer = await seedCustomer();
    const plan = await seedPlan(overrides);
    await assignPlan(customer.id, plan.id);
    return customer;
  }

  async function seedOrganisationWithCreatorPlan(
    overrides: { orgCustomFormIsAvailable?: boolean } = {},
  ) {
    const creator = await seedCustomer('Org Creator');
    const plan = await seedPlan(overrides);
    await assignPlan(creator.id, plan.id);
    const organisation = await prisma.organisation.create({
      data: { name: 'Acme Inc', createdByCustomerId: creator.id },
    });
    seededOrganisationIds.push(organisation.id);
    return organisation;
  }

  async function seedEcard(customerId: string) {
    return prisma.eCard.create({
      data: {
        customerId,
        endpoint: `exchange-contact-forms-test-${randomUUID()}`,
        heroName: 'Test',
        heroEmail: 'test@example.com',
      },
    });
  }

  const nameField: ExchangeContactFormFieldDto = {
    type: 'SHORT_TEXT',
    tag: 'LEAD_NAME',
    label: 'Name',
    isRequired: true,
  };

  describe('create', () => {
    it('creates a form with version 1 as current, persisting fields/tags/options in order', async () => {
      const customer = await seedCustomerWithPlan();

      const form = await service.create({
        customerId: customer.id,
        name: 'Trade show 2026',
        fields: [
          nameField,
          {
            type: 'MULTIPLE_CHOICE',
            label: 'Which service?',
            isRequired: false,
            options: [{ label: 'Consulting' }, { label: 'Support' }],
          },
        ],
      });

      expect(form.customerId).toBe(customer.id);
      expect(form.organisationId).toBeNull();
      expect(form.currentVersion.versionNumber).toBe(1);
      expect(form.currentVersion.fields).toHaveLength(2);
      expect(form.currentVersion.fields[0]).toMatchObject({
        type: 'SHORT_TEXT',
        tag: 'LEAD_NAME',
        order: 0,
      });
      expect(form.currentVersion.fields[1].options.map((o) => o.label)).toEqual(
        ['Consulting', 'Support'],
      );
    });

    it('persists a BREAK field with an empty label, no options, and isRequired false', async () => {
      const customer = await seedCustomerWithPlan();

      const form = await service.create({
        customerId: customer.id,
        name: 'Staged form',
        fields: [
          nameField,
          { type: 'BREAK' },
          {
            type: 'SHORT_TEXT',
            label: 'Question 1',
            isRequired: false,
          },
        ],
      });

      const breakField = form.currentVersion.fields[1];
      expect(breakField).toMatchObject({
        type: 'BREAK',
        tag: null,
        label: '',
        helpText: null,
        isRequired: false,
        order: 1,
      });
      expect(breakField.options).toHaveLength(0);
    });

    it('blocks creation when the plan does not allow customizable forms', async () => {
      const customer = await seedCustomerWithPlan({
        customFormIsAvailable: false,
      });

      await expect(
        service.create({
          customerId: customer.id,
          name: 'Blocked form',
          fields: [nameField],
        }),
      ).rejects.toThrow(
        "This customer's plan does not include customizable exchange contact forms",
      );
    });

    it('blocks creation once the customer is at their form-count cap', async () => {
      const customer = await seedCustomerWithPlan({ maxCustomForms: 1 });
      await service.create({
        customerId: customer.id,
        name: 'First form',
        fields: [nameField],
      });

      await expect(
        service.create({
          customerId: customer.id,
          name: 'Second form',
          fields: [nameField],
        }),
      ).rejects.toThrow(
        "This customer's plan has reached its customizable exchange contact form limit",
      );
    });
  });

  describe('get / list', () => {
    it('throws NotFoundException for an unknown formId', async () => {
      await expect(service.getById(randomUUID())).rejects.toThrow(
        'Exchange contact form not found',
      );
    });

    it('lists only the given customer’s forms', async () => {
      const customerA = await seedCustomerWithPlan();
      const customerB = await seedCustomerWithPlan();
      await service.create({
        customerId: customerA.id,
        name: 'A form',
        fields: [nameField],
      });
      await service.create({
        customerId: customerB.id,
        name: 'B form',
        fields: [nameField],
      });

      const listA = await service.listForCustomer(customerA.id);
      expect(listA).toHaveLength(1);
      expect(listA[0].name).toBe('A form');
    });
  });

  describe('update (versioning)', () => {
    it('mutates the current version in place when it has zero submissions', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const originalVersionId = created.currentVersion.id;

      const { form, forked } = await service.update(created.id, {
        fields: [
          nameField,
          { type: 'DATE', label: 'When?', isRequired: false },
        ],
      });

      expect(forked).toBe(false);
      expect(form.currentVersion.id).toBe(originalVersionId);
      expect(form.currentVersion.versionNumber).toBe(1);
      expect(form.currentVersion.fields).toHaveLength(2);
    });

    it('forks a new version once the current one has a submission, leaving the old version’s fields untouched', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const originalVersionId = created.currentVersion.id;
      const originalFieldId = created.currentVersion.fields[0].id;

      // Simulate a public submission directly against this version.
      const lead = await prisma.lead.create({
        data: { customerId: customer.id, name: 'A Visitor' },
      });
      await prisma.exchangeContactFormSubmission.create({
        data: { versionId: originalVersionId, leadId: lead.id },
      });

      const { form, forked } = await service.update(created.id, {
        fields: [
          nameField,
          { type: 'DATE', label: 'When?', isRequired: false },
        ],
      });

      expect(forked).toBe(true);
      expect(form.currentVersion.id).not.toBe(originalVersionId);
      expect(form.currentVersion.versionNumber).toBe(2);
      expect(form.currentVersion.fields).toHaveLength(2);

      const versions = await service.listVersions(created.id);
      const oldVersion = versions.find((v) => v.id === originalVersionId)!;
      expect(oldVersion.isCurrent).toBe(false);
      expect(oldVersion.submissionCount).toBe(1);

      const oldVersionFields = await prisma.exchangeContactFormField.findMany({
        where: { versionId: originalVersionId },
      });
      expect(oldVersionFields).toHaveLength(1);
      expect(oldVersionFields[0].id).toBe(originalFieldId);
    });

    it('throws NotFoundException when updating an unknown formId', async () => {
      await expect(
        service.update(randomUUID(), { fields: [nameField] }),
      ).rejects.toThrow('Exchange contact form not found');
    });
  });

  describe('deleteVersion', () => {
    it('deletes a non-current, submission-free version', async () => {
      // A version only ever becomes non-current by forking, which the
      // service only ever does once that version has a submission — so a
      // non-current version is never naturally submission-free through the
      // service's own API. To exercise the "submission-free" branch of the
      // guard in isolation, fork by giving v1 a submission, then remove that
      // submission directly (representing it being independently cleaned up
      // some other way, e.g. its Lead being deleted) before deleting v1.
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const v1Id = created.currentVersion.id;
      const lead = await prisma.lead.create({
        data: { customerId: customer.id, name: 'A Visitor' },
      });
      const submission = await prisma.exchangeContactFormSubmission.create({
        data: { versionId: v1Id, leadId: lead.id },
      });
      await service.update(created.id, {
        fields: [
          nameField,
          { type: 'DATE', label: 'When?', isRequired: false },
        ],
      });
      await prisma.exchangeContactFormSubmission.delete({
        where: { id: submission.id },
      });

      await expect(
        service.deleteVersion(created.id, v1Id),
      ).resolves.toBeUndefined();
      const versions = await service.listVersions(created.id);
      expect(versions.find((v) => v.id === v1Id)).toBeUndefined();
    });

    it('blocks deleting the current version', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });

      await expect(
        service.deleteVersion(created.id, created.currentVersion.id),
      ).rejects.toThrow(
        'The current version cannot be deleted on its own — delete the whole form instead',
      );
    });

    it('blocks deleting a version that already has a submission', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const v1Id = created.currentVersion.id;
      const lead = await prisma.lead.create({
        data: { customerId: customer.id, name: 'A Visitor' },
      });
      await prisma.exchangeContactFormSubmission.create({
        data: { versionId: v1Id, leadId: lead.id },
      });
      await service.update(created.id, {
        fields: [
          nameField,
          { type: 'DATE', label: 'When?', isRequired: false },
        ],
      });

      await expect(service.deleteVersion(created.id, v1Id)).rejects.toThrow(
        'This version cannot be deleted because it already has submissions',
      );
    });
  });

  describe('deleteForm', () => {
    it('deletes a form with no submissions on any version', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });

      await expect(service.deleteForm(created.id)).resolves.toBeUndefined();
      await expect(service.getById(created.id)).rejects.toThrow(
        'Exchange contact form not found',
      );
    });

    it('blocks deleting a form when any (even non-current) version has a submission', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const v1Id = created.currentVersion.id;
      const lead = await prisma.lead.create({
        data: { customerId: customer.id, name: 'A Visitor' },
      });
      await prisma.exchangeContactFormSubmission.create({
        data: { versionId: v1Id, leadId: lead.id },
      });
      await service.update(created.id, {
        fields: [
          nameField,
          { type: 'DATE', label: 'When?', isRequired: false },
        ],
      });

      await expect(service.deleteForm(created.id)).rejects.toThrow(
        'This form cannot be deleted because one or more of its versions already has submissions',
      );
    });
  });

  describe('setLinkedEcards', () => {
    it('links the requested e-cards and unlinks any previously-linked card left out of a later call', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const cardA = await seedEcard(customer.id);
      const cardB = await seedEcard(customer.id);

      await service.setLinkedEcards(created.id, [cardA.id, cardB.id]);
      let refreshed = await service.getById(created.id);
      expect(new Set(refreshed.linkedEcardIds)).toEqual(
        new Set([cardA.id, cardB.id]),
      );

      await service.setLinkedEcards(created.id, [cardB.id]);
      refreshed = await service.getById(created.id);
      expect(refreshed.linkedEcardIds).toEqual([cardB.id]);
      const cardAAfter = await prisma.eCard.findUniqueOrThrow({
        where: { id: cardA.id },
      });
      expect(cardAAfter.customFormId).toBeNull();
    });

    it('rejects an e-card that does not belong to the form’s customer', async () => {
      const customer = await seedCustomerWithPlan();
      const otherCustomer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const foreignCard = await seedEcard(otherCustomer.id);

      await expect(
        service.setLinkedEcards(created.id, [foreignCard.id]),
      ).rejects.toThrow(
        'One or more e-cards do not belong to this form’s customer',
      );
    });

    it('rejects the whole batch without partial application when any card’s plan denies custom-form access', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create({
        customerId: customer.id,
        name: 'Form',
        fields: [nameField],
      });
      const cardA = await seedEcard(customer.id);
      const cardB = await seedEcard(customer.id);

      // Revoke access after the form/cards already exist.
      const deniedPlan = await seedPlan({ customFormIsAvailable: false });
      await assignPlan(customer.id, deniedPlan.id);

      await expect(
        service.setLinkedEcards(created.id, [cardA.id, cardB.id]),
      ).rejects.toThrow(
        "This customer's plan does not include customizable exchange contact forms",
      );
      const cardAAfter = await prisma.eCard.findUniqueOrThrow({
        where: { id: cardA.id },
      });
      expect(cardAAfter.customFormId).toBeNull();
    });
  });

  describe('organisation template', () => {
    it('creates the template on the first upsert', async () => {
      const organisation = await seedOrganisationWithCreatorPlan({
        orgCustomFormIsAvailable: true,
      });

      const { form, forked } = await service.upsertForOrganisation(
        organisation.id,
        { name: 'Org template', fields: [nameField] },
      );

      expect(forked).toBe(false);
      expect(form.organisationId).toBe(organisation.id);
      expect(form.customerId).toBeNull();
      expect(form.currentVersion.versionNumber).toBe(1);

      const fetched = await service.getByOrganisationId(organisation.id);
      expect(fetched?.id).toBe(form.id);
    });

    it('mutates the template in place on a second upsert with no submissions', async () => {
      const organisation = await seedOrganisationWithCreatorPlan({
        orgCustomFormIsAvailable: true,
      });
      const created = await service.upsertForOrganisation(organisation.id, {
        name: 'Org template',
        fields: [nameField],
      });

      const { form, forked } = await service.upsertForOrganisation(
        organisation.id,
        {
          name: 'Org template v2',
          fields: [
            nameField,
            { type: 'DATE', label: 'When?', isRequired: false },
          ],
        },
      );

      expect(forked).toBe(false);
      expect(form.id).toBe(created.form.id);
      expect(form.currentVersion.id).toBe(created.form.currentVersion.id);
      expect(form.name).toBe('Org template v2');
      expect(form.currentVersion.fields).toHaveLength(2);
    });

    it('forks a new version once the template has a submission', async () => {
      const organisation = await seedOrganisationWithCreatorPlan({
        orgCustomFormIsAvailable: true,
      });
      const created = await service.upsertForOrganisation(organisation.id, {
        name: 'Org template',
        fields: [nameField],
      });
      const memberCustomer = await seedCustomer('Member');
      const lead = await prisma.lead.create({
        data: { customerId: memberCustomer.id, name: 'A Visitor' },
      });
      await prisma.exchangeContactFormSubmission.create({
        data: {
          versionId: created.form.currentVersion.id,
          leadId: lead.id,
        },
      });

      const { form, forked } = await service.upsertForOrganisation(
        organisation.id,
        {
          name: 'Org template',
          fields: [
            nameField,
            { type: 'DATE', label: 'When?', isRequired: false },
          ],
        },
      );

      expect(forked).toBe(true);
      expect(form.currentVersion.id).not.toBe(created.form.currentVersion.id);
      expect(form.currentVersion.versionNumber).toBe(2);
    });

    it('fails closed when the org creator’s plan denies custom-form access', async () => {
      const organisation = await seedOrganisationWithCreatorPlan({
        orgCustomFormIsAvailable: false,
      });

      await expect(
        service.upsertForOrganisation(organisation.id, {
          name: 'Org template',
          fields: [nameField],
        }),
      ).rejects.toThrow(
        "This customer's plan does not include customizable exchange contact forms",
      );
    });

    it('fails closed when the organisation has no resolvable creator', async () => {
      const organisation = await prisma.organisation.create({
        data: { name: 'Ownerless Org' },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.upsertForOrganisation(organisation.id, {
          name: 'Org template',
          fields: [nameField],
        }),
      ).rejects.toThrow(
        "This customer's plan does not include customizable exchange contact forms",
      );
    });

    it('getByOrganisationId returns null when no template exists', async () => {
      const organisation = await seedOrganisationWithCreatorPlan();
      await expect(
        service.getByOrganisationId(organisation.id),
      ).resolves.toBeNull();
    });

    it('deleteForOrganisation no-ops when no template exists', async () => {
      const organisation = await seedOrganisationWithCreatorPlan();
      await expect(
        service.deleteForOrganisation(organisation.id),
      ).resolves.toBeUndefined();
    });

    it('deleteForOrganisation removes a submission-free template', async () => {
      const organisation = await seedOrganisationWithCreatorPlan({
        orgCustomFormIsAvailable: true,
      });
      await service.upsertForOrganisation(organisation.id, {
        name: 'Org template',
        fields: [nameField],
      });

      await service.deleteForOrganisation(organisation.id);

      await expect(
        service.getByOrganisationId(organisation.id),
      ).resolves.toBeNull();
    });
  });
});
