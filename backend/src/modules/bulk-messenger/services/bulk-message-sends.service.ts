import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  BulkMessageRecipientStatus,
  Prisma,
} from '../../../generated/prisma/client';
import {
  BULK_MESSAGE_SEND_INVALID_RECIPIENT_MESSAGE,
  BULK_MESSAGE_SEND_NO_RECIPIENTS_MESSAGE,
  BULK_MESSAGE_SEND_NOT_FOUND_MESSAGE,
  BULK_MESSAGE_SEND_RECIPIENT_NOT_FOUND_MESSAGE,
  BulkMessageLeadCoreFields,
} from '../bulk-messenger.constants';
import type { CreateBulkMessageSendDto } from '../dto/create-bulk-message-send.dto';
import { resolveBulkMessagePlaceholders } from '../utils/resolve-bulk-message-placeholders.util';
import { BulkMessagePlaceholderService } from './bulk-message-placeholder.service';
import { BulkMessageTemplatesService } from './bulk-message-templates.service';

const LEAD_WITH_ANSWERS_INCLUDE = {
  formSubmission: {
    include: {
      answers: {
        include: {
          field: { select: { label: true } },
          textAnswer: true,
          choiceAnswer: {
            include: { selectedOption: { select: { label: true } } },
          },
          dateAnswer: true,
        },
      },
    },
  },
} satisfies Prisma.LeadInclude;

type LeadWithAnswers = Prisma.LeadGetPayload<{
  include: typeof LEAD_WITH_ANSWERS_INCLUDE;
}>;

type SubmissionAnswer = NonNullable<
  LeadWithAnswers['formSubmission']
>['answers'][number];

const SEND_INCLUDE = {
  recipients: { orderBy: { recipientNameSnapshot: 'asc' as const } },
} satisfies Prisma.BulkMessageSendInclude;

type SendWithRecipients = Prisma.BulkMessageSendGetPayload<{
  include: typeof SEND_INCLUDE;
}>;

export interface BulkMessageSendSummary {
  id: string;
  templateNameSnapshot: string;
  linkedFormNameSnapshot: string | null;
  totalRecipients: number;
  messagedCount: number;
  pendingCount: number;
  createdAt: Date;
}

export interface BulkMessageRecipientRow {
  id: string;
  leadId: string | null;
  recipientNameSnapshot: string;
  recipientEmailSnapshot: string | null;
  countryDialCodeSnapshot: string;
  phoneNumberSnapshot: string;
  resolvedMessage: string;
  status: BulkMessageRecipientStatus;
  messagedAt: Date | null;
}

export interface BulkMessageSendDetail extends BulkMessageSendSummary {
  bodySnapshot: string;
  recipients: BulkMessageRecipientRow[];
}

export interface ValidLeadRow {
  leadId: string;
  name: string;
  email: string | null;
  countryDialCode: string | null;
  phoneNumber: string | null;
  hasUsablePhone: boolean;
}

function hasUsablePhone(lead: {
  countryDialCode: string | null;
  phoneNumber: string | null;
}): boolean {
  return Boolean(lead.countryDialCode && lead.phoneNumber);
}

function toCoreFields(lead: {
  name: string;
  email: string | null;
  countryDialCode: string | null;
  phoneNumber: string | null;
  company: string | null;
  profession: string | null;
  note: string | null;
  location: string | null;
}): BulkMessageLeadCoreFields {
  return {
    name: lead.name,
    email: lead.email,
    countryDialCode: lead.countryDialCode,
    phoneNumber: lead.phoneNumber,
    company: lead.company,
    profession: lead.profession,
    note: lead.note,
    location: lead.location,
  };
}

function stringifyAnswer(answer: SubmissionAnswer): string {
  if (answer.textAnswer) {
    return answer.textAnswer.value;
  }
  if (answer.choiceAnswer) {
    return answer.choiceAnswer.selectedOption.label;
  }
  if (answer.dateAnswer) {
    return answer.dateAnswer.value.toISOString().slice(0, 10);
  }
  return '';
}

@Injectable()
export class BulkMessageSendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templatesService: BulkMessageTemplatesService,
    private readonly placeholderService: BulkMessagePlaceholderService,
  ) {}

  async listForCustomer(customerId: string): Promise<BulkMessageSendSummary[]> {
    const sends = await this.prisma.bulkMessageSend.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { recipients: { select: { status: true } } },
    });

    return sends.map((send) => {
      const messagedCount = send.recipients.filter(
        (recipient) => recipient.status === BulkMessageRecipientStatus.MESSAGED,
      ).length;
      return {
        id: send.id,
        templateNameSnapshot: send.templateNameSnapshot,
        linkedFormNameSnapshot: send.linkedFormNameSnapshot,
        totalRecipients: send.recipients.length,
        messagedCount,
        pendingCount: send.recipients.length - messagedCount,
        createdAt: send.createdAt,
      };
    });
  }

  async getDetailForCustomer(
    customerId: string,
    id: string,
  ): Promise<BulkMessageSendDetail> {
    const send = await this.prisma.bulkMessageSend.findUnique({
      where: { id },
      include: SEND_INCLUDE,
    });
    if (!send || send.customerId !== customerId) {
      throw new NotFoundException(BULK_MESSAGE_SEND_NOT_FOUND_MESSAGE);
    }
    return this.toDetail(send);
  }

  async getValidLeadsForTemplate(
    customerId: string,
    templateId: string,
  ): Promise<ValidLeadRow[]> {
    const template = await this.templatesService.getOwnedOrThrow(
      customerId,
      templateId,
    );
    const leads = await this.prisma.lead.findMany({
      where: this.validLeadsWhere(customerId, template.linkedFormId),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        countryDialCode: true,
        phoneNumber: true,
      },
    });
    return leads.map((lead) => ({
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      countryDialCode: lead.countryDialCode,
      phoneNumber: lead.phoneNumber,
      hasUsablePhone: hasUsablePhone(lead),
    }));
  }

  async createSend(
    customerId: string,
    dto: CreateBulkMessageSendDto,
  ): Promise<BulkMessageSendDetail> {
    const template = await this.templatesService.getOwnedOrThrow(
      customerId,
      dto.templateId,
    );

    const uniqueLeadIds = [...new Set(dto.leadIds)];
    if (uniqueLeadIds.length === 0) {
      throw new BadRequestException(BULK_MESSAGE_SEND_NO_RECIPIENTS_MESSAGE);
    }

    const validLeads = await this.prisma.lead.findMany({
      where: this.validLeadsWhere(customerId, template.linkedFormId),
      include: LEAD_WITH_ANSWERS_INCLUDE,
    });
    const validById = new Map(validLeads.map((lead) => [lead.id, lead]));

    const selectedLeads: LeadWithAnswers[] = [];
    for (const leadId of uniqueLeadIds) {
      const lead = validById.get(leadId);
      if (!lead || !hasUsablePhone(lead)) {
        throw new BadRequestException(
          BULK_MESSAGE_SEND_INVALID_RECIPIENT_MESSAGE,
        );
      }
      selectedLeads.push(lead);
    }

    const slugByLabel = template.linkedFormId
      ? this.placeholderService.buildSlugByLabel(
          await this.placeholderService.getOwnedFormUntaggedFields(
            customerId,
            template.linkedFormId,
          ),
        )
      : new Map<string, string>();

    const recipientsData = selectedLeads.map((lead) => {
      const formAnswerValueBySlug = new Map<string, string>();
      for (const answer of lead.formSubmission?.answers ?? []) {
        const slug = slugByLabel.get(answer.field.label);
        if (slug) {
          formAnswerValueBySlug.set(slug, stringifyAnswer(answer));
        }
      }
      return {
        leadId: lead.id,
        recipientNameSnapshot: lead.name,
        recipientEmailSnapshot: lead.email,
        // Guaranteed present by the hasUsablePhone check above.
        countryDialCodeSnapshot: lead.countryDialCode as string,
        phoneNumberSnapshot: lead.phoneNumber as string,
        resolvedMessage: resolveBulkMessagePlaceholders({
          body: template.body,
          lead: toCoreFields(lead),
          formAnswerValueBySlug,
        }),
      };
    });

    const send = await this.prisma.bulkMessageSend.create({
      data: {
        customerId,
        templateId: template.id,
        templateNameSnapshot: template.name,
        bodySnapshot: template.body,
        linkedFormIdSnapshot: template.linkedFormId,
        linkedFormNameSnapshot: template.linkedForm?.name ?? null,
        recipients: { create: recipientsData },
      },
      include: SEND_INCLUDE,
    });
    return this.toDetail(send);
  }

  async markRecipientMessaged(
    customerId: string,
    sendId: string,
    recipientId: string,
  ): Promise<void> {
    const send = await this.prisma.bulkMessageSend.findUnique({
      where: { id: sendId },
      select: { id: true, customerId: true },
    });
    if (!send || send.customerId !== customerId) {
      throw new NotFoundException(BULK_MESSAGE_SEND_NOT_FOUND_MESSAGE);
    }

    const recipient = await this.prisma.bulkMessageSendRecipient.findUnique({
      where: { id: recipientId },
      select: { id: true, sendId: true, status: true },
    });
    if (!recipient || recipient.sendId !== sendId) {
      throw new NotFoundException(
        BULK_MESSAGE_SEND_RECIPIENT_NOT_FOUND_MESSAGE,
      );
    }
    if (recipient.status === BulkMessageRecipientStatus.MESSAGED) {
      return;
    }

    await this.prisma.bulkMessageSendRecipient.update({
      where: { id: recipientId },
      data: {
        status: BulkMessageRecipientStatus.MESSAGED,
        messagedAt: new Date(),
      },
    });
  }

  async deleteSend(customerId: string, id: string): Promise<void> {
    const send = await this.prisma.bulkMessageSend.findUnique({
      where: { id },
      select: { id: true, customerId: true },
    });
    if (!send || send.customerId !== customerId) {
      throw new NotFoundException(BULK_MESSAGE_SEND_NOT_FOUND_MESSAGE);
    }
    await this.prisma.bulkMessageSend.delete({ where: { id } });
  }

  private validLeadsWhere(
    customerId: string,
    linkedFormId: string | null,
  ): Prisma.LeadWhereInput {
    if (!linkedFormId) {
      return { customerId };
    }
    return {
      customerId,
      formSubmission: { version: { formId: linkedFormId } },
    };
  }

  private toDetail(send: SendWithRecipients): BulkMessageSendDetail {
    const messagedCount = send.recipients.filter(
      (recipient) => recipient.status === BulkMessageRecipientStatus.MESSAGED,
    ).length;
    return {
      id: send.id,
      templateNameSnapshot: send.templateNameSnapshot,
      linkedFormNameSnapshot: send.linkedFormNameSnapshot,
      bodySnapshot: send.bodySnapshot,
      totalRecipients: send.recipients.length,
      messagedCount,
      pendingCount: send.recipients.length - messagedCount,
      createdAt: send.createdAt,
      recipients: send.recipients.map((recipient) => ({
        id: recipient.id,
        leadId: recipient.leadId,
        recipientNameSnapshot: recipient.recipientNameSnapshot,
        recipientEmailSnapshot: recipient.recipientEmailSnapshot,
        countryDialCodeSnapshot: recipient.countryDialCodeSnapshot,
        phoneNumberSnapshot: recipient.phoneNumberSnapshot,
        resolvedMessage: recipient.resolvedMessage,
        status: recipient.status,
        messagedAt: recipient.messagedAt,
      })),
    };
  }
}
