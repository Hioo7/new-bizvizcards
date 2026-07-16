import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import type { CreatePlanDto } from '../dto/create-plan.dto';
import type { EcardPolicyDto } from '../dto/ecard-policy.dto';
import type { EventPolicyDto } from '../dto/event-policy.dto';
import type { ListPlansQueryDto } from '../dto/list-plans-query.dto';
import type { OrganisationPolicyDto } from '../dto/organisation-policy.dto';
import type { SmartCardPolicyDto } from '../dto/smart-card-policy.dto';
import type { UpdatePlanDto } from '../dto/update-plan.dto';
import {
  PLAN_DELETE_ORPHAN_ONLY_MESSAGE,
  PLAN_LIST_DEFAULT_PAGE,
  PLAN_LIST_DEFAULT_PAGE_SIZE,
  PLAN_NOT_FOUND_MESSAGE,
} from '../plans.constants';
import { planPolicyInclude } from './plan-policy-resolver.service';
import type {
  EcardPolicyWithRelations,
  SmartCardPolicyWithRelations,
} from './plan-policy-resolver.service';

export interface PlanSummary {
  id: string;
  name: string;
  price: number;
  businessModelType: string;
  subscriptionDurationMonths: number | null;
  isPublic: boolean;
  isFallbackPlan: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanDetail extends PlanSummary {
  ecardPolicy: EcardPolicyDto;
  smartCardPolicy: SmartCardPolicyDto;
  organisationPolicy: OrganisationPolicyDto;
  eventPolicy: EventPolicyDto;
}

export interface PlanListResult {
  plans: PlanSummary[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanDto): Promise<PlanDetail> {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        price: dto.price,
        businessModelType: dto.businessModelType,
        subscriptionDurationMonths: dto.subscriptionDurationMonths ?? null,
        isPublic: dto.isPublic,
        policy: {
          create: {
            ecardPolicy: {
              create: this.buildEcardPolicyCreateData(dto.ecardPolicy),
            },
            smartCardPolicy: {
              create: this.buildSmartCardPolicyCreateData(dto.smartCardPolicy),
            },
            organisationPolicy: {
              create: {
                isAvailable: dto.organisationPolicy.isAvailable,
                maxOrgsCanJoin: dto.organisationPolicy.maxOrgsCanJoin,
                maxOrgsCanCreate: dto.organisationPolicy.maxOrgsCanCreate,
                orgEcardPolicy: {
                  create: this.buildEcardPolicyCreateData(
                    dto.organisationPolicy.orgEcardPolicy,
                  ),
                },
                orgSmartCardPolicy: {
                  create: this.buildSmartCardPolicyCreateData(
                    dto.organisationPolicy.orgSmartCardPolicy,
                  ),
                },
              },
            },
            eventPolicy: {
              create: {
                isAvailable: dto.eventPolicy.isAvailable,
                maxEvents: dto.eventPolicy.maxEvents,
                maxGuestsPerEvent: dto.eventPolicy.maxGuestsPerEvent,
              },
            },
          },
        },
      },
    });

    return this.getByIdOrThrow(plan.id);
  }

  async list(query: ListPlansQueryDto): Promise<PlanListResult> {
    const page = query.page ?? PLAN_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? PLAN_LIST_DEFAULT_PAGE_SIZE;

    const where = {
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' as const },
      }),
    };

    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      plans: plans.map((plan) => this.toSummary(plan)),
      total,
      page,
      pageSize,
    };
  }

  async getByIdOrThrow(id: string): Promise<PlanDetail> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { policy: { include: planPolicyInclude } },
    });
    if (!plan || !plan.policy) {
      throw new NotFoundException(PLAN_NOT_FOUND_MESSAGE);
    }

    return {
      ...this.toSummary(plan),
      ecardPolicy: this.toEcardPolicyDto(plan.policy.ecardPolicy),
      smartCardPolicy: this.toSmartCardPolicyDto(plan.policy.smartCardPolicy),
      organisationPolicy: {
        isAvailable: plan.policy.organisationPolicy.isAvailable,
        maxOrgsCanJoin: plan.policy.organisationPolicy.maxOrgsCanJoin,
        maxOrgsCanCreate: plan.policy.organisationPolicy.maxOrgsCanCreate,
        orgEcardPolicy: this.toEcardPolicyDto(
          plan.policy.organisationPolicy.orgEcardPolicy,
        ),
        orgSmartCardPolicy: this.toSmartCardPolicyDto(
          plan.policy.organisationPolicy.orgSmartCardPolicy,
        ),
      },
      eventPolicy: {
        isAvailable: plan.policy.eventPolicy.isAvailable,
        maxEvents: plan.policy.eventPolicy.maxEvents,
        maxGuestsPerEvent: plan.policy.eventPolicy.maxGuestsPerEvent,
      },
    };
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanDetail> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      select: {
        policy: {
          select: {
            ecardPolicyId: true,
            smartCardPolicyId: true,
            organisationPolicyId: true,
            eventPolicyId: true,
          },
        },
      },
    });
    if (!plan || !plan.policy) {
      throw new NotFoundException(PLAN_NOT_FOUND_MESSAGE);
    }

    await this.prisma.$transaction(async (tx) => {
      const planData: Prisma.PlanUpdateInput = {};
      if (dto.name !== undefined) {
        planData.name = dto.name;
      }
      if (dto.price !== undefined) {
        planData.price = dto.price;
      }
      if (dto.isPublic !== undefined) {
        planData.isPublic = dto.isPublic;
      }
      if (dto.businessModelType !== undefined) {
        planData.businessModelType = dto.businessModelType;
        planData.subscriptionDurationMonths =
          dto.businessModelType === 'SUBSCRIPTION'
            ? (dto.subscriptionDurationMonths ?? undefined)
            : null;
      } else if (dto.subscriptionDurationMonths !== undefined) {
        planData.subscriptionDurationMonths = dto.subscriptionDurationMonths;
      }
      if (Object.keys(planData).length > 0) {
        await tx.plan.update({ where: { id }, data: planData });
      }

      if (dto.ecardPolicy) {
        await this.replaceEcardPolicy(
          tx,
          plan.policy!.ecardPolicyId,
          dto.ecardPolicy,
        );
      }
      if (dto.smartCardPolicy) {
        await this.replaceSmartCardPolicy(
          tx,
          plan.policy!.smartCardPolicyId,
          dto.smartCardPolicy,
        );
      }
      if (dto.organisationPolicy) {
        const orgPolicy = await tx.organisationPolicy.findUniqueOrThrow({
          where: { id: plan.policy!.organisationPolicyId },
          select: { orgEcardPolicyId: true, orgSmartCardPolicyId: true },
        });
        await tx.organisationPolicy.update({
          where: { id: plan.policy!.organisationPolicyId },
          data: {
            isAvailable: dto.organisationPolicy.isAvailable,
            maxOrgsCanJoin: dto.organisationPolicy.maxOrgsCanJoin,
            maxOrgsCanCreate: dto.organisationPolicy.maxOrgsCanCreate,
          },
        });
        await this.replaceEcardPolicy(
          tx,
          orgPolicy.orgEcardPolicyId,
          dto.organisationPolicy.orgEcardPolicy,
        );
        await this.replaceSmartCardPolicy(
          tx,
          orgPolicy.orgSmartCardPolicyId,
          dto.organisationPolicy.orgSmartCardPolicy,
        );
      }
      if (dto.eventPolicy) {
        await tx.eventPolicy.update({
          where: { id: plan.policy!.eventPolicyId },
          data: {
            isAvailable: dto.eventPolicy.isAvailable,
            maxEvents: dto.eventPolicy.maxEvents,
            maxGuestsPerEvent: dto.eventPolicy.maxGuestsPerEvent,
          },
        });
      }
    });

    return this.getByIdOrThrow(id);
  }

  async setFallbackPlan(id: string): Promise<PlanDetail> {
    await this.getByIdOrThrow(id);

    await this.prisma.$transaction([
      this.prisma.plan.updateMany({
        where: { isFallbackPlan: true },
        data: { isFallbackPlan: false },
      }),
      this.prisma.plan.update({
        where: { id },
        data: { isFallbackPlan: true },
      }),
    ]);

    return this.getByIdOrThrow(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      select: { isFallbackPlan: true },
    });
    if (!plan) {
      throw new NotFoundException(PLAN_NOT_FOUND_MESSAGE);
    }

    const [historyCount, currentCustomerCount] = await Promise.all([
      this.prisma.planPurchaseHistory.count({ where: { planId: id } }),
      this.prisma.customer.count({ where: { currentPlanId: id } }),
    ]);

    if (historyCount > 0 || currentCustomerCount > 0 || plan.isFallbackPlan) {
      throw new ConflictException(PLAN_DELETE_ORPHAN_ONLY_MESSAGE);
    }

    await this.prisma.plan.delete({ where: { id } });
  }

  private buildEcardPolicyCreateData(
    dto: EcardPolicyDto,
  ): Prisma.EcardPolicyCreateWithoutPlanPolicyInput {
    return {
      isAvailable: dto.isAvailable,
      maxEcards: dto.maxEcards,
      exchangeContactAccess: dto.exchangeContactAccess,
      componentAvailabilities: {
        create: dto.componentAvailabilities.map((component) => ({
          type: component.type,
          isAvailable: component.isAvailable,
          ...(component.galleryLimits && {
            galleryLimits: { create: component.galleryLimits },
          }),
        })),
      },
    };
  }

  private buildSmartCardPolicyCreateData(
    dto: SmartCardPolicyDto,
  ): Prisma.SmartCardPolicyCreateWithoutPlanPolicyInput {
    return {
      isAvailable: dto.isAvailable,
      maxSmartCards: dto.maxSmartCards,
      exchangeContactAccess: dto.exchangeContactAccess,
      whitelistedTemplates: {
        create: dto.whitelistedTemplateIds.map((templateId) => ({
          templateId,
        })),
      },
    };
  }

  private async replaceEcardPolicy(
    tx: Prisma.TransactionClient,
    ecardPolicyId: string,
    dto: EcardPolicyDto,
  ): Promise<void> {
    await tx.ecardPolicy.update({
      where: { id: ecardPolicyId },
      data: {
        isAvailable: dto.isAvailable,
        maxEcards: dto.maxEcards,
        exchangeContactAccess: dto.exchangeContactAccess,
      },
    });
    // Full-replace, mirroring EcardsService.update()'s existing convention
    // for nested collections — cascades away any galleryLimits satellite.
    await tx.ecardComponentAvailability.deleteMany({
      where: { ecardPolicyId },
    });
    for (const component of dto.componentAvailabilities) {
      await tx.ecardComponentAvailability.create({
        data: {
          ecardPolicyId,
          type: component.type,
          isAvailable: component.isAvailable,
          ...(component.galleryLimits && {
            galleryLimits: { create: component.galleryLimits },
          }),
        },
      });
    }
  }

  private async replaceSmartCardPolicy(
    tx: Prisma.TransactionClient,
    smartCardPolicyId: string,
    dto: SmartCardPolicyDto,
  ): Promise<void> {
    await tx.smartCardPolicy.update({
      where: { id: smartCardPolicyId },
      data: {
        isAvailable: dto.isAvailable,
        maxSmartCards: dto.maxSmartCards,
        exchangeContactAccess: dto.exchangeContactAccess,
      },
    });
    await tx.smartCardPolicyTemplateWhitelist.deleteMany({
      where: { smartCardPolicyId },
    });
    if (dto.whitelistedTemplateIds.length > 0) {
      await tx.smartCardPolicyTemplateWhitelist.createMany({
        data: dto.whitelistedTemplateIds.map((templateId) => ({
          smartCardPolicyId,
          templateId,
        })),
      });
    }
  }

  private toEcardPolicyDto(
    ecardPolicy: EcardPolicyWithRelations,
  ): EcardPolicyDto {
    return {
      isAvailable: ecardPolicy.isAvailable,
      maxEcards: ecardPolicy.maxEcards,
      exchangeContactAccess: ecardPolicy.exchangeContactAccess,
      componentAvailabilities: ecardPolicy.componentAvailabilities.map(
        (component) => ({
          type: component.type,
          isAvailable: component.isAvailable,
          ...(component.galleryLimits && {
            galleryLimits: {
              maxGalleries: component.galleryLimits.maxGalleries,
              maxImagesPerGallery: component.galleryLimits.maxImagesPerGallery,
              maxGallerySizeBytes: component.galleryLimits.maxGallerySizeBytes,
            },
          }),
        }),
      ),
    };
  }

  private toSmartCardPolicyDto(
    smartCardPolicy: SmartCardPolicyWithRelations,
  ): SmartCardPolicyDto {
    return {
      isAvailable: smartCardPolicy.isAvailable,
      maxSmartCards: smartCardPolicy.maxSmartCards,
      exchangeContactAccess: smartCardPolicy.exchangeContactAccess,
      whitelistedTemplateIds: smartCardPolicy.whitelistedTemplates.map(
        (whitelisted) => whitelisted.templateId,
      ),
    };
  }

  private toSummary(plan: {
    id: string;
    name: string;
    price: Prisma.Decimal;
    businessModelType: string;
    subscriptionDurationMonths: number | null;
    isPublic: boolean;
    isFallbackPlan: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): PlanSummary {
    return {
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      businessModelType: plan.businessModelType,
      subscriptionDurationMonths: plan.subscriptionDurationMonths,
      isPublic: plan.isPublic,
      isFallbackPlan: plan.isFallbackPlan,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
