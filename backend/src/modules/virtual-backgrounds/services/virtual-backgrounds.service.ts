import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'path';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { AppConfigService } from '../../../common/config/app-config.service';
import {
  Prisma,
  VirtualBackgroundQrCorner,
} from '../../../generated/prisma/client';
import { ECARD_PUBLIC_PAGE_PATH_PREFIX } from '../../ecards/ecard-og-preview.constants';
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
} from '../virtual-backgrounds.constants';

export interface VirtualBackgroundSummary {
  id: string;
  ecardId: string;
  qrCorner: VirtualBackgroundQrCorner;
  captionText: string | null;
  imageUrl: string;
  createdAt: Date;
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

    const ecardUrl = `${this.appConfig.publicAppBaseUrl}${ECARD_PUBLIC_PAGE_PATH_PREFIX}/${ecard.endpoint}`;
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
