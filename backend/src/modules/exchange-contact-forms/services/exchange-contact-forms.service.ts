import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
  Prisma,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import type { CreateExchangeContactFormDto } from '../dto/create-exchange-contact-form.dto';
import type { ExchangeContactFormFieldDto } from '../dto/exchange-contact-form-field.dto';
import type { UpdateExchangeContactFormDto } from '../dto/update-exchange-contact-form.dto';
import type { UpsertOrganisationExchangeContactFormTemplateDto } from '../dto/upsert-organisation-exchange-contact-form-template.dto';
import {
  EXCHANGE_CONTACT_FORM_DELETE_HAS_SUBMISSIONS_MESSAGE,
  EXCHANGE_CONTACT_FORM_DELETE_LINKED_TO_BULK_MESSAGE_TEMPLATE_MESSAGE,
  EXCHANGE_CONTACT_FORM_ECARD_OWNERSHIP_MISMATCH_MESSAGE,
  EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE,
  EXCHANGE_CONTACT_FORM_VERSION_DELETE_CURRENT_MESSAGE,
  EXCHANGE_CONTACT_FORM_VERSION_DELETE_HAS_SUBMISSIONS_MESSAGE,
  EXCHANGE_CONTACT_FORM_VERSION_NOT_FOUND_MESSAGE,
} from '../exchange-contact-forms.constants';

// Only the current version's fields are ever loaded for the admin
// list/detail views — old (immutable, submission-bearing) versions are only
// browsed via listVersions/deleteVersion, never round-tripped through the
// builder.
const FULL_INCLUDE = {
  versions: {
    where: { isCurrent: true },
    include: {
      fields: {
        orderBy: { order: 'asc' as const },
        include: { options: { orderBy: { order: 'asc' as const } } },
      },
    },
  },
  linkedEcards: { select: { id: true } },
} satisfies Prisma.ExchangeContactFormInclude;

type FullForm = NonNullable<
  Awaited<ReturnType<ExchangeContactFormsService['findFullByIdOrThrow']>>
>;

export interface ExchangeContactFormFieldOptionResponse {
  id: string;
  label: string;
  order: number;
}

export interface ExchangeContactFormFieldResponse {
  id: string;
  order: number;
  type: ExchangeContactFieldType;
  tag: ExchangeContactFieldTag | null;
  label: string;
  helpText: string | null;
  isRequired: boolean;
  options: ExchangeContactFormFieldOptionResponse[];
}

export interface ExchangeContactFormVersionResponse {
  id: string;
  versionNumber: number;
  fields: ExchangeContactFormFieldResponse[];
}

export interface ExchangeContactFormResponse {
  id: string;
  customerId: string | null;
  organisationId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  linkedEcardIds: string[];
  currentVersion: ExchangeContactFormVersionResponse;
}

export interface ExchangeContactFormVersionSummaryResponse {
  id: string;
  versionNumber: number;
  isCurrent: boolean;
  submissionCount: number;
  createdAt: Date;
}

/**
 * CRUD + versioning for customizable exchange-contact forms. Serves both a
 * customer's own forms (owned via `customerId`) and — reusing the exact same
 * models per the "shared model, nullable owner FK" design decision — an
 * organisation's exchange-contact-form template (owned via `organisationId`,
 * see the employee-organisation-exchange-contact-form-template controller).
 * Only `create`/`setLinkedEcards` are customer-form-specific; every other
 * method is ownership-agnostic.
 */
@Injectable()
export class ExchangeContactFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planEnforcementService: PlanEnforcementService,
  ) {}

  async listForCustomer(
    customerId: string,
  ): Promise<ExchangeContactFormResponse[]> {
    const forms = await this.prisma.exchangeContactForm.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: FULL_INCLUDE,
    });
    return forms.map((form) => this.toResponse(form));
  }

  async getById(formId: string): Promise<ExchangeContactFormResponse> {
    const form = await this.findFullByIdOrThrow(formId);
    return this.toResponse(form);
  }

  async create(
    dto: CreateExchangeContactFormDto,
  ): Promise<ExchangeContactFormResponse> {
    await this.planEnforcementService.assertCanCreateCustomForm(dto.customerId);

    const formId = await this.prisma.$transaction(async (tx) => {
      const form = await tx.exchangeContactForm.create({
        data: { customerId: dto.customerId, name: dto.name },
      });
      const version = await tx.exchangeContactFormVersion.create({
        data: { formId: form.id, versionNumber: 1, isCurrent: true },
      });
      await this.createFields(tx, version.id, dto.fields);
      return form.id;
    });

    return this.getById(formId);
  }

  async update(
    formId: string,
    dto: UpdateExchangeContactFormDto,
  ): Promise<{ form: ExchangeContactFormResponse; forked: boolean }> {
    const existing = await this.findFullByIdOrThrow(formId);
    const currentVersion = existing.versions[0];

    const forked = await this.prisma.$transaction(async (tx) => {
      if (dto.name !== undefined) {
        await tx.exchangeContactForm.update({
          where: { id: formId },
          data: { name: dto.name },
        });
      }
      return this.replaceCurrentVersionFields(
        tx,
        formId,
        currentVersion,
        dto.fields,
      );
    });

    return { form: await this.getById(formId), forked };
  }

  async listVersions(
    formId: string,
  ): Promise<ExchangeContactFormVersionSummaryResponse[]> {
    await this.assertFormExists(formId);
    const versions = await this.prisma.exchangeContactFormVersion.findMany({
      where: { formId },
      orderBy: { versionNumber: 'desc' },
      include: { _count: { select: { submissions: true } } },
    });
    return versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      isCurrent: version.isCurrent,
      submissionCount: version._count.submissions,
      createdAt: version.createdAt,
    }));
  }

  async deleteVersion(formId: string, versionId: string): Promise<void> {
    const version = await this.prisma.exchangeContactFormVersion.findUnique({
      where: { id: versionId },
      include: { _count: { select: { submissions: true } } },
    });
    if (!version || version.formId !== formId) {
      throw new NotFoundException(
        EXCHANGE_CONTACT_FORM_VERSION_NOT_FOUND_MESSAGE,
      );
    }
    if (version.isCurrent) {
      throw new ConflictException(
        EXCHANGE_CONTACT_FORM_VERSION_DELETE_CURRENT_MESSAGE,
      );
    }
    if (version._count.submissions > 0) {
      throw new ConflictException(
        EXCHANGE_CONTACT_FORM_VERSION_DELETE_HAS_SUBMISSIONS_MESSAGE,
      );
    }
    await this.prisma.exchangeContactFormVersion.delete({
      where: { id: versionId },
    });
  }

  async deleteForm(formId: string): Promise<void> {
    await this.assertFormExists(formId);
    const submissionCount =
      await this.prisma.exchangeContactFormSubmission.count({
        where: { version: { formId } },
      });
    if (submissionCount > 0) {
      throw new ConflictException(
        EXCHANGE_CONTACT_FORM_DELETE_HAS_SUBMISSIONS_MESSAGE,
      );
    }
    // A bulk-messenger template that inherits this form's fields as
    // placeholders holds an onDelete: Restrict FK to it — surface a friendly
    // 409 before the DB rejects the delete.
    const linkedTemplateCount = await this.prisma.bulkMessageTemplate.count({
      where: { linkedFormId: formId },
    });
    if (linkedTemplateCount > 0) {
      throw new ConflictException(
        EXCHANGE_CONTACT_FORM_DELETE_LINKED_TO_BULK_MESSAGE_TEMPLATE_MESSAGE,
      );
    }
    await this.prisma.exchangeContactForm.delete({ where: { id: formId } });
  }

  // Full target set, not a delta — diffs against the form's currently-linked
  // e-cards and applies link/unlink atomically. Customer-form-specific: an
  // organisation's template auto-applies to every member card instead of
  // being linked per-card, so this is never called for one.
  async setLinkedEcards(formId: string, ecardIds: string[]): Promise<void> {
    const form = await this.assertFormExists(formId);
    const uniqueIds = [...new Set(ecardIds)];

    if (uniqueIds.length > 0) {
      const cards = await this.prisma.eCard.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, customerId: true, organisationId: true },
      });
      const ownedByThisCustomer =
        cards.length === uniqueIds.length &&
        cards.every((card) => card.customerId === form.customerId);
      if (!ownedByThisCustomer) {
        throw new BadRequestException(
          EXCHANGE_CONTACT_FORM_ECARD_OWNERSHIP_MISMATCH_MESSAGE,
        );
      }
      for (const card of cards) {
        await this.planEnforcementService.assertCustomFormAccessAllowedForCard(
          card,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.eCard.updateMany({
        where: { customFormId: formId, id: { notIn: uniqueIds } },
        data: { customFormId: null },
      }),
      this.prisma.eCard.updateMany({
        where: { id: { in: uniqueIds } },
        data: { customFormId: formId },
      }),
    ]);
  }

  // ── organisation template (singleton per org) ───────────────────────────

  async getByOrganisationId(
    organisationId: string,
  ): Promise<ExchangeContactFormResponse | null> {
    const form = await this.prisma.exchangeContactForm.findUnique({
      where: { organisationId },
      include: FULL_INCLUDE,
    });
    return form ? this.toResponse(form) : null;
  }

  // Creates the template on its first save; every subsequent save runs
  // through the same mutate-in-place-or-fork versioning as a customer form's
  // own update. Fails closed (via assertCustomFormAccessAllowedForOrganisationTemplate)
  // rather than degrading permissively — this is the template's own hard
  // gate, not a boost applied on top of something else, same reasoning as
  // PlanEnforcementService.assertHeroLayoutAllowedForOrganisationTemplate.
  async upsertForOrganisation(
    organisationId: string,
    dto: UpsertOrganisationExchangeContactFormTemplateDto,
  ): Promise<{ form: ExchangeContactFormResponse; forked: boolean }> {
    await this.planEnforcementService.assertCustomFormAccessAllowedForOrganisationTemplate(
      organisationId,
    );

    const existing = await this.prisma.exchangeContactForm.findUnique({
      where: { organisationId },
      include: FULL_INCLUDE,
    });

    if (!existing) {
      const formId = await this.prisma.$transaction(async (tx) => {
        const form = await tx.exchangeContactForm.create({
          data: { organisationId, name: dto.name },
        });
        const version = await tx.exchangeContactFormVersion.create({
          data: { formId: form.id, versionNumber: 1, isCurrent: true },
        });
        await this.createFields(tx, version.id, dto.fields);
        return form.id;
      });
      return { form: await this.getById(formId), forked: false };
    }

    const currentVersion = existing.versions[0];
    const forked = await this.prisma.$transaction(async (tx) => {
      await tx.exchangeContactForm.update({
        where: { id: existing.id },
        data: { name: dto.name },
      });
      return this.replaceCurrentVersionFields(
        tx,
        existing.id,
        currentVersion,
        dto.fields,
      );
    });
    return { form: await this.getById(existing.id), forked };
  }

  // No-op if the organisation has no template — same "removing it entirely
  // reverts every member back to their own form/legacy default" convention
  // as OrganisationEcardTemplateService's delete.
  async deleteForOrganisation(organisationId: string): Promise<void> {
    const existing = await this.prisma.exchangeContactForm.findUnique({
      where: { organisationId },
      select: { id: true },
    });
    if (!existing) {
      return;
    }
    await this.deleteForm(existing.id);
  }

  // ── shared versioning ────────────────────────────────────────────────────

  // Mutates the current version's fields in place as long as it has zero
  // submissions; the moment it has any, forks a new version (copy-on-write)
  // and moves the "current" pointer — old versions stay permanently
  // queryable so past submissions always resolve against the exact field
  // list they were answered against. Shared by both a customer form's update
  // and an organisation template's upsert.
  private async replaceCurrentVersionFields(
    tx: Prisma.TransactionClient,
    formId: string,
    currentVersion: { id: string; versionNumber: number },
    fields: ExchangeContactFormFieldDto[],
  ): Promise<boolean> {
    const hasSubmissions =
      (await tx.exchangeContactFormSubmission.count({
        where: { versionId: currentVersion.id },
      })) > 0;

    let targetVersionId = currentVersion.id;
    let forked = false;
    if (hasSubmissions) {
      const newVersion = await tx.exchangeContactFormVersion.create({
        data: {
          formId,
          versionNumber: currentVersion.versionNumber + 1,
          isCurrent: false,
        },
      });
      await tx.exchangeContactFormVersion.update({
        where: { id: currentVersion.id },
        data: { isCurrent: false },
      });
      await tx.exchangeContactFormVersion.update({
        where: { id: newVersion.id },
        data: { isCurrent: true },
      });
      targetVersionId = newVersion.id;
      forked = true;
    } else {
      await tx.exchangeContactFormField.deleteMany({
        where: { versionId: targetVersionId },
      });
    }

    await this.createFields(tx, targetVersionId, fields);
    return forked;
  }

  private async createFields(
    tx: Prisma.TransactionClient,
    versionId: string,
    fields: ExchangeContactFormFieldDto[],
  ): Promise<void> {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      // BREAK is a structural marker, not a question — it has no
      // label/helpText/isRequired in the DTO (see breakFieldSchema), so
      // fixed empty/false values are written for those columns instead of
      // reading them off the field.
      const fieldRow = await tx.exchangeContactFormField.create({
        data: {
          versionId,
          order: i,
          type: field.type,
          tag: field.tag ?? null,
          label: field.type === 'BREAK' ? '' : field.label,
          helpText: field.type === 'BREAK' ? null : (field.helpText ?? null),
          isRequired: field.type === 'BREAK' ? false : field.isRequired,
        },
      });
      if (field.type === 'MULTIPLE_CHOICE' || field.type === 'DROPDOWN') {
        for (let j = 0; j < field.options.length; j++) {
          await tx.exchangeContactFormFieldOption.create({
            data: {
              fieldId: fieldRow.id,
              label: field.options[j].label,
              order: j,
            },
          });
        }
      }
    }
  }

  // ── read helpers ─────────────────────────────────────────────────────────

  private async findFullByIdOrThrow(formId: string) {
    const form = await this.prisma.exchangeContactForm.findUnique({
      where: { id: formId },
      include: FULL_INCLUDE,
    });
    if (!form) {
      throw new NotFoundException(EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE);
    }
    return form;
  }

  private async assertFormExists(
    formId: string,
  ): Promise<{ customerId: string | null; organisationId: string | null }> {
    const form = await this.prisma.exchangeContactForm.findUnique({
      where: { id: formId },
      select: { customerId: true, organisationId: true },
    });
    if (!form) {
      throw new NotFoundException(EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE);
    }
    return form;
  }

  private toResponse(form: FullForm): ExchangeContactFormResponse {
    const currentVersion = form.versions[0];
    return {
      id: form.id,
      customerId: form.customerId,
      organisationId: form.organisationId,
      name: form.name,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      linkedEcardIds: form.linkedEcards.map((card) => card.id),
      currentVersion: {
        id: currentVersion.id,
        versionNumber: currentVersion.versionNumber,
        fields: currentVersion.fields.map((field) => ({
          id: field.id,
          order: field.order,
          type: field.type,
          tag: field.tag,
          label: field.label,
          helpText: field.helpText,
          isRequired: field.isRequired,
          options: field.options.map((option) => ({
            id: option.id,
            label: option.label,
            order: option.order,
          })),
        })),
      },
    };
  }
}
