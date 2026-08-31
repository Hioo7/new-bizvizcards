import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExchangeContactFieldType,
  LeadSourceType,
  Prisma,
} from '../../../generated/prisma/client';
import type { LeadModel } from '../../../generated/prisma/models';
import type { SubmitCustomFormExchangeContactDto } from '../../exchange-contact-forms/dto/submit-custom-form-exchange-contact.dto';
import {
  EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE,
  EXCHANGE_CONTACT_FORM_SUBMISSION_MISSING_REQUIRED_MESSAGE,
  EXCHANGE_CONTACT_FORM_SUBMISSION_VERSION_STALE_MESSAGE,
} from '../../exchange-contact-forms/exchange-contact-forms.constants';
import { ExchangeContactFormResolutionService } from '../../exchange-contact-forms/services/exchange-contact-form-resolution.service';
import { mapCustomFormAnswersToLeadFields } from '../../exchange-contact-forms/utils/map-custom-form-answers.util';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import type { CreateLeadDto } from '../dto/create-lead.dto';
import type { ExchangeContactDto } from '../dto/exchange-contact.dto';
import type { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
import type { UpdateLeadDto } from '../dto/update-lead.dto';

// The lead-detail view (getById) needs every custom-question answer alongside
// the lead's own columns; list/update/delete never do, so this include stays
// scoped to getById's own query rather than living on a shared base query.
const LEAD_DETAIL_INCLUDE = {
  formSubmission: {
    include: {
      answers: {
        include: {
          field: true,
          textAnswer: true,
          choiceAnswer: { include: { selectedOption: true } },
          dateAnswer: true,
        },
      },
    },
  },
} satisfies Prisma.LeadInclude;

export interface LeadFormAnswerResponse {
  fieldId: string;
  label: string;
  type: ExchangeContactFieldType;
  order: number;
  value: string;
}

export type LeadDetailResponse = LeadModel & {
  formAnswers: LeadFormAnswerResponse[];
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planEnforcementService: PlanEnforcementService,
    private readonly exchangeContactFormResolutionService: ExchangeContactFormResolutionService,
  ) {}

  async createFromExchangeContact(
    endpoint: string,
    dto: ExchangeContactDto,
  ): Promise<LeadModel> {
    const smartCard = await this.prisma.smartCard.findUnique({
      where: { endpoint },
      select: {
        id: true,
        customerId: true,
        customer: { select: { defaultLeadFolderId: true } },
      },
    });

    if (!smartCard || !smartCard.customerId || !smartCard.customer) {
      throw new NotFoundException('Smart card not found');
    }

    await this.planEnforcementService.assertExchangeContactAllowed(
      'SMART_CARD',
      smartCard.customerId,
    );

    return this.createLeadFromExchange(
      smartCard.customerId,
      smartCard.customer.defaultLeadFolderId,
      LeadSourceType.SMART_CARD,
      dto,
    );
  }

  async createFromEcardExchangeContact(
    endpoint: string,
    dto: ExchangeContactDto,
  ): Promise<LeadModel> {
    const ecard = await this.prisma.eCard.findUnique({
      where: { endpoint },
      select: {
        id: true,
        customerId: true,
        organisationId: true,
        customer: { select: { defaultLeadFolderId: true } },
      },
    });

    if (!ecard) {
      throw new NotFoundException('E-card not found');
    }

    await this.planEnforcementService.assertExchangeContactAllowed(
      'ECARD',
      ecard.customerId,
      ecard.organisationId,
    );

    return this.createLeadFromExchange(
      ecard.customerId,
      ecard.customer.defaultLeadFolderId,
      LeadSourceType.E_CARD,
      dto,
      ecard.id,
    );
  }

  // Parallel to createFromEcardExchangeContact above, for a custom
  // (non-legacy) form. Independently re-resolves the card's currently
  // effective form/version server-side — dto.formVersionId is only ever
  // used to detect a race against a concurrent edit, never trusted as
  // authoritative — and creates the Lead plus the submission/answer rows
  // atomically in one transaction.
  async createFromEcardCustomFormExchangeContact(
    endpoint: string,
    dto: SubmitCustomFormExchangeContactDto,
  ): Promise<LeadModel> {
    const ecard = await this.prisma.eCard.findUnique({
      where: { endpoint },
      select: {
        id: true,
        customerId: true,
        organisationId: true,
        customFormId: true,
        customer: { select: { defaultLeadFolderId: true } },
      },
    });

    if (!ecard) {
      throw new NotFoundException('E-card not found');
    }

    await this.planEnforcementService.assertExchangeContactAllowed(
      'ECARD',
      ecard.customerId,
      ecard.organisationId,
    );

    const resolved =
      await this.exchangeContactFormResolutionService.resolveForCard(ecard);
    if (!resolved) {
      throw new NotFoundException(EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE);
    }
    if (resolved.versionId !== dto.formVersionId) {
      throw new ConflictException(
        EXCHANGE_CONTACT_FORM_SUBMISSION_VERSION_STALE_MESSAGE,
      );
    }

    const { leadFields, customAnswers } = mapCustomFormAnswersToLeadFields(
      resolved.fields,
      dto.answers,
    );
    if (!leadFields.name) {
      // Belt-and-suspenders: exchangeContactFormFieldsSchema already forces
      // exactly one required LEAD_NAME-tagged field at form-save time, so
      // this should be unreachable — but Lead.name is non-nullable at the
      // DB level, so this is verified again right before the write.
      throw new BadRequestException(
        EXCHANGE_CONTACT_FORM_SUBMISSION_MISSING_REQUIRED_MESSAGE,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          customerId: ecard.customerId,
          sourcedBy: LeadSourceType.E_CARD,
          folderId: ecard.customer.defaultLeadFolderId ?? undefined,
          ecardId: ecard.id,
          name: leadFields.name!,
          email: leadFields.email,
          countryDialCode: leadFields.countryDialCode,
          phoneNumber: leadFields.phoneNumber,
          note: leadFields.note,
          company: leadFields.company,
          profession: leadFields.profession,
          locationLatitude: leadFields.locationLatitude,
          locationLongitude: leadFields.locationLongitude,
        },
      });

      const submission = await tx.exchangeContactFormSubmission.create({
        data: { versionId: resolved.versionId, leadId: lead.id },
      });

      for (const answer of customAnswers) {
        const answerRow = await tx.exchangeContactFormSubmissionAnswer.create({
          data: { submissionId: submission.id, fieldId: answer.fieldId },
        });
        switch (answer.kind) {
          case 'TEXT':
            await tx.exchangeContactFormSubmissionTextAnswer.create({
              data: { answerId: answerRow.id, value: answer.value },
            });
            break;
          case 'CHOICE':
            await tx.exchangeContactFormSubmissionChoiceAnswer.create({
              data: {
                answerId: answerRow.id,
                selectedOptionId: answer.selectedOptionId,
              },
            });
            break;
          case 'DATE':
            await tx.exchangeContactFormSubmissionDateAnswer.create({
              data: { answerId: answerRow.id, value: answer.value },
            });
            break;
        }
      }

      return lead;
    });
  }

  private createLeadFromExchange(
    customerId: string,
    defaultLeadFolderId: string | null,
    sourcedBy: LeadSourceType,
    dto: ExchangeContactDto,
    ecardId?: string,
  ): Promise<LeadModel> {
    return this.prisma.lead.create({
      data: {
        customerId,
        sourcedBy,
        folderId: defaultLeadFolderId ?? undefined,
        ecardId,
        name: dto.name,
        email: dto.email,
        countryDialCode: dto.countryDialCode,
        phoneNumber: dto.phoneNumber,
        note: dto.note,
        locationLatitude: dto.locationLatitude,
        locationLongitude: dto.locationLongitude,
      },
    });
  }

  list(customerId: string, query: ListLeadsQueryDto): Promise<LeadModel[]> {
    return this.prisma.lead.findMany({
      where: {
        customerId,
        ...(query.folderId !== undefined && { folderId: query.folderId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnseenCount(customerId: string): Promise<{ count: number }> {
    const count = await this.prisma.lead.count({
      where: { customerId, seenAt: null },
    });
    return { count };
  }

  async markAllSeen(customerId: string): Promise<void> {
    await this.prisma.lead.updateMany({
      where: { customerId, seenAt: null },
      data: { seenAt: new Date() },
    });
  }

  async getById(customerId: string, id: string): Promise<LeadDetailResponse> {
    const lead = await this.findWithFormSubmission(customerId, id);
    return this.toDetailResponse(lead);
  }

  async create(customerId: string, dto: CreateLeadDto): Promise<LeadModel> {
    if (dto.folderId) {
      await this.assertFolderOwnership(customerId, dto.folderId);
    }

    return this.prisma.lead.create({
      data: {
        customerId,
        sourcedBy: dto.sourcedBy ?? LeadSourceType.MANUAL_ENTRY,
        name: dto.name,
        email: dto.email,
        countryDialCode: dto.countryDialCode,
        phoneNumber: dto.phoneNumber,
        note: dto.note,
        company: dto.company,
        profession: dto.profession,
        location: dto.location,
        locationLatitude: dto.locationLatitude,
        locationLongitude: dto.locationLongitude,
        folderId: dto.folderId,
      },
    });
  }

  async update(
    customerId: string,
    id: string,
    dto: UpdateLeadDto,
  ): Promise<LeadModel> {
    await this.findOwnedLeadOrThrow(customerId, id);

    if (dto.folderId) {
      await this.assertFolderOwnership(customerId, dto.folderId);
    }

    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
  }

  async delete(customerId: string, id: string): Promise<void> {
    await this.findOwnedLeadOrThrow(customerId, id);
    await this.prisma.lead.delete({ where: { id } });
  }

  private async findOwnedLeadOrThrow(
    customerId: string,
    id: string,
  ): Promise<LeadModel> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.customerId !== customerId) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  private async findWithFormSubmission(customerId: string, id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: LEAD_DETAIL_INCLUDE,
    });
    if (!lead || lead.customerId !== customerId) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  private toDetailResponse(
    lead: NonNullable<
      Awaited<ReturnType<LeadsService['findWithFormSubmission']>>
    >,
  ): LeadDetailResponse {
    const { formSubmission, ...scalarFields } = lead;
    const formAnswers: LeadFormAnswerResponse[] = (
      formSubmission?.answers ?? []
    )
      .map((answer) => ({
        fieldId: answer.field.id,
        label: answer.field.label,
        type: answer.field.type,
        order: answer.field.order,
        value: resolveFormAnswerValue(answer),
      }))
      .sort((a, b) => a.order - b.order);
    return { ...scalarFields, formAnswers };
  }

  private async assertFolderOwnership(
    customerId: string,
    folderId: string,
  ): Promise<void> {
    const folder = await this.prisma.leadFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder || folder.customerId !== customerId) {
      throw new NotFoundException('Lead folder not found');
    }
  }
}

type FullFormAnswer = NonNullable<
  Awaited<ReturnType<LeadsService['findWithFormSubmission']>>['formSubmission']
>['answers'][number];

function resolveFormAnswerValue(answer: FullFormAnswer): string {
  if (answer.textAnswer) return answer.textAnswer.value;
  if (answer.choiceAnswer) return answer.choiceAnswer.selectedOption.label;
  if (answer.dateAnswer) return answer.dateAnswer.value.toISOString();
  return '';
}
