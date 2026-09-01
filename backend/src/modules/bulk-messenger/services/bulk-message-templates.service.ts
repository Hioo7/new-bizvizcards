import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import {
  BULK_MESSAGE_TEMPLATE_NOT_FOUND_MESSAGE,
  BULK_MESSAGE_UNKNOWN_PLACEHOLDER_MESSAGE,
} from '../bulk-messenger.constants';
import type { CreateBulkMessageTemplateDto } from '../dto/create-bulk-message-template.dto';
import type { UpdateBulkMessageTemplateDto } from '../dto/update-bulk-message-template.dto';
import { findUnknownPlaceholderTokens } from '../utils/resolve-bulk-message-placeholders.util';
import { BulkMessagePlaceholderService } from './bulk-message-placeholder.service';

const TEMPLATE_INCLUDE = {
  linkedForm: { select: { id: true, name: true } },
  _count: { select: { sends: true } },
} satisfies Prisma.BulkMessageTemplateInclude;

type TemplateWithRelations = Prisma.BulkMessageTemplateGetPayload<{
  include: typeof TEMPLATE_INCLUDE;
}>;

export interface BulkMessageTemplateSummary {
  id: string;
  name: string;
  linkedFormId: string | null;
  linkedFormName: string | null;
  sendCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkMessageTemplateDetail extends BulkMessageTemplateSummary {
  body: string;
}

@Injectable()
export class BulkMessageTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planEnforcementService: PlanEnforcementService,
    private readonly placeholderService: BulkMessagePlaceholderService,
  ) {}

  async listForCustomer(
    customerId: string,
  ): Promise<BulkMessageTemplateSummary[]> {
    const templates = await this.prisma.bulkMessageTemplate.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: TEMPLATE_INCLUDE,
    });
    return templates.map((template) => this.toSummary(template));
  }

  async getDetailForCustomer(
    customerId: string,
    id: string,
  ): Promise<BulkMessageTemplateDetail> {
    return this.toDetail(await this.getOwnedOrThrow(customerId, id));
  }

  async create(
    customerId: string,
    dto: CreateBulkMessageTemplateDto,
  ): Promise<BulkMessageTemplateDetail> {
    await this.planEnforcementService.assertCanCreateBulkMessageTemplate(
      customerId,
    );

    const linkedFormId = dto.linkedFormId ?? null;
    await this.assertBodyPlaceholdersKnown(customerId, dto.body, linkedFormId);

    const template = await this.prisma.bulkMessageTemplate.create({
      data: { customerId, name: dto.name, body: dto.body, linkedFormId },
      include: TEMPLATE_INCLUDE,
    });
    return this.toDetail(template);
  }

  async update(
    customerId: string,
    id: string,
    dto: UpdateBulkMessageTemplateDto,
  ): Promise<BulkMessageTemplateDetail> {
    const existing = await this.getOwnedOrThrow(customerId, id);

    const linkedFormChanged = 'linkedFormId' in dto;
    const nextLinkedFormId = linkedFormChanged
      ? (dto.linkedFormId ?? null)
      : existing.linkedFormId;
    const nextBody = dto.body ?? existing.body;

    // Re-validate only when the body or the linked form is actually changing —
    // a name-only edit never needs to touch the message. When it does change,
    // the body is checked against the form that will be linked (covers both a
    // reworded message and a swapped/cleared form).
    if (dto.body !== undefined || linkedFormChanged) {
      await this.assertBodyPlaceholdersKnown(
        customerId,
        nextBody,
        nextLinkedFormId,
      );
    }

    const data: Prisma.BulkMessageTemplateUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.body !== undefined) {
      data.body = dto.body;
    }
    if (linkedFormChanged) {
      data.linkedForm = nextLinkedFormId
        ? { connect: { id: nextLinkedFormId } }
        : { disconnect: true };
    }

    const template = await this.prisma.bulkMessageTemplate.update({
      where: { id },
      data,
      include: TEMPLATE_INCLUDE,
    });
    return this.toDetail(template);
  }

  async delete(customerId: string, id: string): Promise<void> {
    await this.getOwnedOrThrow(customerId, id);
    // Past sends keep their snapshots — their templateId is set to null by the
    // FK's onDelete: SetNull.
    await this.prisma.bulkMessageTemplate.delete({ where: { id } });
  }

  // Loads the template and confirms ownership, throwing 404 (not 403) either
  // way so a foreign template's existence isn't leaked.
  async getOwnedOrThrow(
    customerId: string,
    id: string,
  ): Promise<TemplateWithRelations> {
    const template = await this.prisma.bulkMessageTemplate.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    });
    if (!template || template.customerId !== customerId) {
      throw new NotFoundException(BULK_MESSAGE_TEMPLATE_NOT_FOUND_MESSAGE);
    }
    return template;
  }

  private async assertBodyPlaceholdersKnown(
    customerId: string,
    body: string,
    linkedFormId: string | null,
  ): Promise<void> {
    const availableTokens = await this.placeholderService.getAvailableTokenSet(
      customerId,
      linkedFormId,
    );
    const unknown = findUnknownPlaceholderTokens(body, availableTokens);
    if (unknown.length > 0) {
      throw new BadRequestException(
        `${BULK_MESSAGE_UNKNOWN_PLACEHOLDER_MESSAGE}: ${unknown
          .map((token) => `{${token}}`)
          .join(', ')}`,
      );
    }
  }

  private toSummary(
    template: TemplateWithRelations,
  ): BulkMessageTemplateSummary {
    return {
      id: template.id,
      name: template.name,
      linkedFormId: template.linkedFormId,
      linkedFormName: template.linkedForm?.name ?? null,
      sendCount: template._count.sends,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private toDetail(template: TemplateWithRelations): BulkMessageTemplateDetail {
    return { ...this.toSummary(template), body: template.body };
  }
}
