import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { AppConfigService } from '../../../common/config/app-config.service';
import {
  ECardEventType,
  ECardTrafficSource,
  Prisma,
  VirtualBackgroundQrCorner,
} from '../../../generated/prisma/client';
import { ECARD_PUBLIC_PAGE_PATH_PREFIX } from '../../ecards/ecard-og-preview.constants';
import type { EcardAnalyticsQueryDto } from '../../ecard-analytics/dto/ecard-analytics-query.dto';
import { VIRTUAL_BACKGROUND_TRAFFIC_SOURCE_QUERY_TOKEN } from '../../ecard-analytics/ecard-analytics.constants';
import { buildEcardTrafficSourceUrl } from '../../ecard-analytics/utils/build-ecard-traffic-source-url.util';
import {
  eachUtcDayKey,
  resolveAnalyticsDateRange,
  utcDayKey,
} from '../../ecard-analytics/utils/analytics-date-range.util';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import type { CreateVirtualBackgroundDto } from '../dto/create-virtual-background.dto';
import { VirtualBackgroundComposerService } from './virtual-background-composer.service';
import { VirtualBackgroundTemplatesService } from './virtual-background-templates.service';
import { assertValidVirtualBackgroundImageFile } from '../utils/assert-valid-virtual-background-image-file';
import {
  VIRTUAL_BACKGROUND_NOT_FOUND_MESSAGE,
  VIRTUAL_BACKGROUND_STORAGE_KEY_PREFIX,
  VIRTUAL_BACKGROUND_TEMPLATE_NOT_FOUND_MESSAGE,
  VIRTUAL_BACKGROUND_TRACKED_EVENT_TYPES,
} from '../virtual-backgrounds.constants';

export interface VirtualBackgroundSummary {
  id: string;
  ecardId: string;
  qrCorner: VirtualBackgroundQrCorner;
  captionText: string | null;
  imageUrl: string;
  createdAt: Date;
}

export interface VirtualBackgroundAnalyticsRow {
  virtualBackgroundId: string;
  ecardId: string;
  captionText: string | null;
  imageUrl: string;
  createdAt: Date;
  views: number;
  exchangeContacts: number;
}

export interface VirtualBackgroundAnalyticsResponse {
  from: string;
  to: string;
  totals: { views: number; exchangeContacts: number };
  perBackground: VirtualBackgroundAnalyticsRow[];
  dailyCounts: { date: string; views: number; exchangeContacts: number }[];
}

function emptyChannelCounts(): { views: number; exchangeContacts: number } {
  return { views: 0, exchangeContacts: 0 };
}

const virtualBackgroundInclude = {
  composedMedia: true,
} satisfies Prisma.VirtualBackgroundInclude;

type VirtualBackgroundWithRelations = Prisma.VirtualBackgroundGetPayload<{
  include: typeof virtualBackgroundInclude;
}>;

@Injectable()
export class VirtualBackgroundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly appConfig: AppConfigService,
    private readonly planEnforcementService: PlanEnforcementService,
    private readonly policyResolverService: PlanPolicyResolverService,
    private readonly composerService: VirtualBackgroundComposerService,
    private readonly templatesService: VirtualBackgroundTemplatesService,
  ) {}

  async listAvailableTemplates(customerId: string) {
    const policy =
      await this.policyResolverService.getEffectivePolicyForCustomer(
        customerId,
      );
    const allowedTemplateIds = policy.virtualBackground.availableTemplates.map(
      (template) => template.id,
    );
    return this.templatesService.listByIds(allowedTemplateIds);
  }

  async listForCustomer(
    customerId: string,
  ): Promise<VirtualBackgroundSummary[]> {
    const virtualBackgrounds = await this.prisma.virtualBackground.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: virtualBackgroundInclude,
    });
    return virtualBackgrounds.map((vb) => this.toSummary(vb));
  }

  async createForCustomer(
    customerId: string,
    dto: CreateVirtualBackgroundDto,
    customFile: Express.Multer.File | undefined,
  ): Promise<VirtualBackgroundSummary> {
    await this.planEnforcementService.assertCanCreateVirtualBackground(
      customerId,
    );

    const ecard = await this.prisma.eCard.findUnique({
      where: { id: dto.ecardId },
    });
    if (!ecard || ecard.customerId !== customerId) {
      throw new NotFoundException('E-card not found');
    }

    const { baseImageBuffer, sourceTemplateId, customBaseMediaId } =
      await this.resolveBaseImage(customerId, dto, customFile);

    // Generated up front: the id is baked into the QR code below and must be
    // reused verbatim as the row's primary key so scans attribute back to it.
    const virtualBackgroundId = randomUUID();
    const ecardUrl = this.buildTrackedEcardUrl(
      ecard.endpoint,
      virtualBackgroundId,
    );
    const composedBuffer = await this.composerService.compose({
      baseImageBuffer,
      ecardUrl,
      qrCorner: dto.qrCorner,
      captionText: dto.captionText ?? null,
    });
    const composedMedia = await this.mediaService.upload({
      buffer: composedBuffer,
      contentType: 'image/png',
      originalName: `${ecard.endpoint}-virtual-background.png`,
      extension: 'png',
      keyPrefix: VIRTUAL_BACKGROUND_STORAGE_KEY_PREFIX,
    });

    const virtualBackground = await this.prisma.virtualBackground.create({
      data: {
        id: virtualBackgroundId,
        customerId,
        ecardId: ecard.id,
        sourceTemplateId,
        customBaseMediaId,
        qrCorner: dto.qrCorner,
        captionText: dto.captionText ?? null,
        composedMediaId: composedMedia.id,
      },
      include: virtualBackgroundInclude,
    });

    return this.toSummary(virtualBackground);
  }

  /**
   * Per-virtual-background scan analytics for the customer's Analytics
   * section: how many people viewed an e-card by scanning each background's
   * QR code, and how many then exchanged contact. Backgrounds with no scans
   * in the window are still listed (with zeros).
   */
  async getAnalyticsForCustomer(
    customerId: string,
    query: EcardAnalyticsQueryDto,
  ): Promise<VirtualBackgroundAnalyticsResponse> {
    const backgrounds = await this.prisma.virtualBackground.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: virtualBackgroundInclude,
    });

    const { from, to } = resolveAnalyticsDateRange(query);
    const dayKeys = eachUtcDayKey(from, to);

    const byBackground = new Map(
      backgrounds.map((bg) => [bg.id, emptyChannelCounts()]),
    );
    const byDay = new Map(dayKeys.map((key) => [key, emptyChannelCounts()]));
    const totals = emptyChannelCounts();

    if (backgrounds.length > 0) {
      const events = await this.prisma.eCardEvent.findMany({
        where: {
          source: ECardTrafficSource.VIRTUAL_BACKGROUND,
          sourceRefId: { in: backgrounds.map((bg) => bg.id) },
          type: { in: [...VIRTUAL_BACKGROUND_TRACKED_EVENT_TYPES] },
          createdAt: { gte: from, lte: to },
        },
        select: { sourceRefId: true, type: true, createdAt: true },
      });

      for (const event of events) {
        const key: 'views' | 'exchangeContacts' =
          event.type === ECardEventType.VIEW ? 'views' : 'exchangeContacts';
        totals[key] += 1;
        const background = event.sourceRefId
          ? byBackground.get(event.sourceRefId)
          : undefined;
        if (background) background[key] += 1;
        const day = byDay.get(utcDayKey(event.createdAt));
        if (day) day[key] += 1;
      }
    }

    return {
      from: utcDayKey(from),
      to: utcDayKey(to),
      totals,
      perBackground: backgrounds.map((bg) => {
        const counts = byBackground.get(bg.id) ?? emptyChannelCounts();
        return {
          virtualBackgroundId: bg.id,
          ecardId: bg.ecardId,
          captionText: bg.captionText,
          imageUrl: this.mediaService.getPublicUrl(bg.composedMedia),
          createdAt: bg.createdAt,
          views: counts.views,
          exchangeContacts: counts.exchangeContacts,
        };
      }),
      dailyCounts: dayKeys.map((date) => {
        const counts = byDay.get(date) ?? emptyChannelCounts();
        return {
          date,
          views: counts.views,
          exchangeContacts: counts.exchangeContacts,
        };
      }),
    };
  }

  async removeForCustomer(customerId: string, id: string): Promise<void> {
    const virtualBackground = await this.prisma.virtualBackground.findUnique({
      where: { id },
    });
    if (!virtualBackground || virtualBackground.customerId !== customerId) {
      throw new NotFoundException(VIRTUAL_BACKGROUND_NOT_FOUND_MESSAGE);
    }
    // Deleting the composed Media row cascades away the VirtualBackground row
    // itself; the custom base media (if any) is left alone (SetNull), same
    // "keep the source asset" convention as ecard hero photos.
    await this.mediaService.delete(virtualBackground.composedMediaId);
  }

  /**
   * Re-renders one existing virtual background's composed PNG so its QR code
   * carries the `?src=&sref=` attribution params added after it was first
   * created. Repoints the row at the new composed media and drops the old
   * one. Idempotent (re-rendering produces the same image). Used only by the
   * one-off backfill script — not reachable from the HTTP surface.
   */
  async recomposeComposedImage(virtualBackgroundId: string): Promise<void> {
    const virtualBackground =
      await this.prisma.virtualBackground.findUniqueOrThrow({
        where: { id: virtualBackgroundId },
        include: {
          customBaseMedia: true,
          sourceTemplate: { include: { media: true } },
          ecard: { select: { endpoint: true } },
        },
      });

    const baseMedia =
      virtualBackground.sourceTemplate?.media ??
      virtualBackground.customBaseMedia;
    if (!baseMedia) {
      throw new NotFoundException(
        `Virtual background ${virtualBackgroundId} has no resolvable base image; cannot recompose`,
      );
    }

    const baseImageBuffer = await this.mediaService.downloadBuffer(baseMedia);
    const composedBuffer = await this.composerService.compose({
      baseImageBuffer,
      ecardUrl: this.buildTrackedEcardUrl(
        virtualBackground.ecard.endpoint,
        virtualBackground.id,
      ),
      qrCorner: virtualBackground.qrCorner,
      captionText: virtualBackground.captionText,
    });

    const previousComposedMediaId = virtualBackground.composedMediaId;
    const newComposedMedia = await this.mediaService.upload({
      buffer: composedBuffer,
      contentType: 'image/png',
      originalName: `${virtualBackground.ecard.endpoint}-virtual-background.png`,
      extension: 'png',
      keyPrefix: VIRTUAL_BACKGROUND_STORAGE_KEY_PREFIX,
    });

    await this.prisma.virtualBackground.update({
      where: { id: virtualBackground.id },
      data: { composedMediaId: newComposedMedia.id },
    });
    // Safe now that nothing references it — the onDelete: Cascade back to
    // VirtualBackground only fires while this media is still the composed one.
    await this.mediaService.delete(previousComposedMediaId);
  }

  private buildTrackedEcardUrl(
    endpoint: string,
    virtualBackgroundId: string,
  ): string {
    return buildEcardTrafficSourceUrl(
      `${this.appConfig.publicAppBaseUrl}${ECARD_PUBLIC_PAGE_PATH_PREFIX}/${endpoint}`,
      VIRTUAL_BACKGROUND_TRAFFIC_SOURCE_QUERY_TOKEN,
      virtualBackgroundId,
    );
  }

  private async resolveBaseImage(
    customerId: string,
    dto: CreateVirtualBackgroundDto,
    customFile: Express.Multer.File | undefined,
  ): Promise<{
    baseImageBuffer: Buffer;
    sourceTemplateId: string | null;
    customBaseMediaId: string | null;
  }> {
    if (dto.source === 'TEMPLATE') {
      await this.planEnforcementService.assertVirtualBackgroundTemplateAllowed(
        customerId,
        dto.templateId,
      );
      const template = await this.prisma.virtualBackgroundTemplate.findUnique({
        where: { id: dto.templateId },
        include: { media: true },
      });
      if (!template) {
        throw new NotFoundException(
          VIRTUAL_BACKGROUND_TEMPLATE_NOT_FOUND_MESSAGE,
        );
      }
      const baseImageBuffer = await this.mediaService.downloadBuffer(
        template.media,
      );
      return {
        baseImageBuffer,
        sourceTemplateId: template.id,
        customBaseMediaId: null,
      };
    }

    await this.planEnforcementService.assertCustomVirtualBackgroundAllowed(
      customerId,
    );
    if (!customFile) {
      throw new BadRequestException(
        'A custom base image file is required for a custom virtual background',
      );
    }
    assertValidVirtualBackgroundImageFile(customFile);
    const customMedia = await this.mediaService.upload({
      buffer: customFile.buffer,
      contentType: customFile.mimetype,
      originalName: customFile.originalname,
      extension: extname(customFile.originalname).slice(1).toLowerCase(),
      keyPrefix: VIRTUAL_BACKGROUND_STORAGE_KEY_PREFIX,
    });
    return {
      baseImageBuffer: customFile.buffer,
      sourceTemplateId: null,
      customBaseMediaId: customMedia.id,
    };
  }

  private toSummary(
    virtualBackground: VirtualBackgroundWithRelations,
  ): VirtualBackgroundSummary {
    return {
      id: virtualBackground.id,
      ecardId: virtualBackground.ecardId,
      qrCorner: virtualBackground.qrCorner,
      captionText: virtualBackground.captionText,
      imageUrl: this.mediaService.getPublicUrl(virtualBackground.composedMedia),
      createdAt: virtualBackground.createdAt,
    };
  }
}
