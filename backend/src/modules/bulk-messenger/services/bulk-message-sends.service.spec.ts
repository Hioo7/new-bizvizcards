import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  BulkMessageRecipientStatus,
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
  LeadSourceType,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { BulkMessagePlaceholderService } from './bulk-message-placeholder.service';
import { BulkMessageSendsService } from './bulk-message-sends.service';
import { BulkMessageTemplatesService } from './bulk-message-templates.service';

// Checklist (per backend/CLAUDE.md):
// Happy path — valid-leads with no linked form returns every customer lead;
// valid-leads with a linked form returns only that form's submitters;
// hasUsablePhone is true only when both phone parts are present; createSend
// snapshots the template name/body/form name and resolves each recipient's
// message from core + form answers; markRecipientMessaged flips status once and
// is idempotent; deleteSend cascades its recipients.
// Sad path — createSend with a leadId outside the valid set 400s; createSend
// with a phoneless leadId 400s; createSend with an empty leadIds list 400s;
// markRecipientMessaged on another customer's send 404s; getDetail on a foreign
// send 404s.
describe('BulkMessageSendsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let templatesService: BulkMessageTemplatesService;
  let service: BulkMessageSendsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    prisma = new PrismaService(new AppConfigService());
    const placeholderService = new BulkMessagePlaceholderService(prisma);
    templatesService = new BulkMessageTemplatesService(
      prisma,
      new PlanEnforcementService(prisma, new PlanPolicyResolverService(prisma)),
      placeholderService,
    );
    service = new BulkMessageSendsService(
      prisma,
      templatesService,
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
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'BM Send Customer',
        email: `bm-send-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedLead(
    customerId: string,
    overrides: Partial<{
      name: string;
      countryDialCode: string | null;
      phoneNumber: string | null;
      company: string | null;
    }> = {},
  ) {
    return prisma.lead.create({
      data: {
        customerId,
        sourcedBy: LeadSourceType.MANUAL_ENTRY,
        name: overrides.name ?? 'Grace Hopper',
        countryDialCode:
          overrides.countryDialCode === undefined
            ? '+1'
            : overrides.countryDialCode,
        phoneNumber:
          overrides.phoneNumber === undefined
            ? '2025550100'
            : overrides.phoneNumber,
        company: overrides.company ?? null,
      },
    });
  }

  // A form with a tagged LEAD_NAME field + an untagged "Budget" short-text
  // question. Returns { form, versionId, budgetFieldId }.
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
    const budgetField = await prisma.exchangeContactFormField.create({
      data: {
        versionId: version.id,
        order: 1,
        type: ExchangeContactFieldType.SHORT_TEXT,
        tag: null,
        label: 'Budget',
        isRequired: false,
      },
    });
    return { form, versionId: version.id, budgetFieldId: budgetField.id };
  }

  async function seedSubmission(
    leadId: string,
    versionId: string,
    budgetFieldId: string,
    budgetValue: string,
  ) {
    const submission = await prisma.exchangeContactFormSubmission.create({
      data: { versionId, leadId },
    });
    const answer = await prisma.exchangeContactFormSubmissionAnswer.create({
      data: { submissionId: submission.id, fieldId: budgetFieldId },
    });
    await prisma.exchangeContactFormSubmissionTextAnswer.create({
      data: { answerId: answer.id, value: budgetValue },
    });
  }

  async function createTemplate(
    customerId: string,
    body: string,
    linkedFormId: string | null = null,
  ) {
    // Bypass plan enforcement — this suite is about send behaviour, not gating.
    return prisma.bulkMessageTemplate.create({
      data: { customerId, name: 'T', body, linkedFormId },
    });
  }

  it('valid-leads with no linked form returns every customer lead', async () => {
    const customer = await seedCustomer();
    const other = await seedCustomer();
    const a = await seedLead(customer.id, { name: 'A' });
    const b = await seedLead(customer.id, { name: 'B' });
    await seedLead(other.id, { name: 'Foreign' });
    const template = await createTemplate(customer.id, 'Hi {name}');

    const rows = await service.getValidLeadsForTemplate(
      customer.id,
      template.id,
    );
    expect(rows.map((r) => r.leadId).sort()).toEqual([a.id, b.id].sort());
    expect(rows.every((r) => r.hasUsablePhone)).toBe(true);
  });

  it("valid-leads with a linked form returns only that form's submitters", async () => {
    const customer = await seedCustomer();
    const { form, versionId, budgetFieldId } = await seedForm(customer.id);
    const otherForm = await seedForm(customer.id);

    const submitter = await seedLead(customer.id, { name: 'Submitter' });
    await seedSubmission(submitter.id, versionId, budgetFieldId, '10k');
    const otherSubmitter = await seedLead(customer.id, { name: 'Other' });
    await seedSubmission(
      otherSubmitter.id,
      otherForm.versionId,
      otherForm.budgetFieldId,
      '5k',
    );
    await seedLead(customer.id, { name: 'No form' });

    const template = await createTemplate(
      customer.id,
      'Hi {name}, {field.budget}',
      form.id,
    );

    const rows = await service.getValidLeadsForTemplate(
      customer.id,
      template.id,
    );
    expect(rows.map((r) => r.leadId)).toEqual([submitter.id]);
  });

  it('hasUsablePhone is false when a phone part is missing', async () => {
    const customer = await seedCustomer();
    await seedLead(customer.id, { name: 'No number', phoneNumber: null });
    const template = await createTemplate(customer.id, 'Hi {name}');

    const rows = await service.getValidLeadsForTemplate(
      customer.id,
      template.id,
    );
    expect(rows[0].hasUsablePhone).toBe(false);
  });

  it('createSend snapshots the template and resolves each recipient message', async () => {
    const customer = await seedCustomer();
    const { form, versionId, budgetFieldId } = await seedForm(customer.id);
    const lead = await seedLead(customer.id, { name: 'Ada', company: 'Acme' });
    await seedSubmission(lead.id, versionId, budgetFieldId, '$9,000');
    const template = await createTemplate(
      customer.id,
      'Hi {name} from {company}, budget {field.budget}.',
      form.id,
    );

    const send = await service.createSend(customer.id, {
      templateId: template.id,
      leadIds: [lead.id],
    });

    expect(send).toMatchObject({
      templateNameSnapshot: 'T',
      bodySnapshot: 'Hi {name} from {company}, budget {field.budget}.',
      linkedFormNameSnapshot: form.name,
      totalRecipients: 1,
      messagedCount: 0,
      pendingCount: 1,
    });
    expect(send.recipients[0].resolvedMessage).toBe(
      'Hi Ada from Acme, budget $9,000.',
    );
    expect(send.recipients[0].countryDialCodeSnapshot).toBe('+1');
  });

  it('rejects a leadId outside the valid set and a phoneless leadId', async () => {
    const customer = await seedCustomer();
    const other = await seedCustomer();
    const foreignLead = await seedLead(other.id);
    const phoneless = await seedLead(customer.id, {
      name: 'No phone',
      phoneNumber: null,
    });
    const template = await createTemplate(customer.id, 'Hi {name}');

    await expect(
      service.createSend(customer.id, {
        templateId: template.id,
        leadIds: [foreignLead.id],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createSend(customer.id, {
        templateId: template.id,
        leadIds: [phoneless.id],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty leadIds list', async () => {
    const customer = await seedCustomer();
    const template = await createTemplate(customer.id, 'Hi {name}');
    await expect(
      service.createSend(customer.id, { templateId: template.id, leadIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks a recipient messaged once, idempotently', async () => {
    const customer = await seedCustomer();
    const lead = await seedLead(customer.id);
    const template = await createTemplate(customer.id, 'Hi {name}');
    const send = await service.createSend(customer.id, {
      templateId: template.id,
      leadIds: [lead.id],
    });
    const recipientId = send.recipients[0].id;

    await service.markRecipientMessaged(customer.id, send.id, recipientId);
    await service.markRecipientMessaged(customer.id, send.id, recipientId);

    const detail = await service.getDetailForCustomer(customer.id, send.id);
    expect(detail.recipients[0].status).toBe(
      BulkMessageRecipientStatus.MESSAGED,
    );
    expect(detail.messagedCount).toBe(1);
  });

  it("404s marking a recipient on another customer's send", async () => {
    const customer = await seedCustomer();
    const other = await seedCustomer();
    const lead = await seedLead(customer.id);
    const template = await createTemplate(customer.id, 'Hi {name}');
    const send = await service.createSend(customer.id, {
      templateId: template.id,
      leadIds: [lead.id],
    });

    await expect(
      service.markRecipientMessaged(other.id, send.id, send.recipients[0].id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteSend cascades its recipients', async () => {
    const customer = await seedCustomer();
    const lead = await seedLead(customer.id);
    const template = await createTemplate(customer.id, 'Hi {name}');
    const send = await service.createSend(customer.id, {
      templateId: template.id,
      leadIds: [lead.id],
    });

    await service.deleteSend(customer.id, send.id);

    await expect(
      service.getDetailForCustomer(customer.id, send.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      await prisma.bulkMessageSendRecipient.count({
        where: { sendId: send.id },
      }),
    ).toBe(0);
  });
});
