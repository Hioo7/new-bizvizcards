import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'path';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { Prisma } from '../../../generated/prisma/client';
import type { CreateVirtualBackgroundTemplateDto } from '../dto/create-virtual-background-template.dto';
import { assertVirtualBackgroundImageDimensions } from '../utils/assert-virtual-background-image-dimensions';
import {
  VIRTUAL_BACKGROUND_MAX_TEMPLATES,
  VIRTUAL_BACKGROUND_TEMPLATE_LIMIT_REACHED_MESSAGE,
  VIRTUAL_BACKGROUND_TEMPLATE_NOT_FOUND_MESSAGE,
  VIRTUAL_BACKGROUND_TEMPLATE_STORAGE_KEY_PREFIX,
} from '../virtual-backgrounds.constants';

export interface VirtualBackgroundTemplateSummary {
  id: string;
  name: string;
  order: number;
  imageUrl: string;
}

const virtualBackgroundTemplateInclude = {
  media: true,
} satisfies Prisma.VirtualBackgroundTemplateInclude;

type TemplateWithMedia = Prisma.VirtualBackgroundTemplateGetPayload<{
  include: typeof virtualBackgroundTemplateInclude;
}>;

@Injectable()
export class VirtualBackgroundTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async list(): Promise<VirtualBackgroundTemplateSummary[]> {
    const templates = await this.prisma.virtualBackgroundTemplate.findMany({
      orderBy: { order: 'asc' },
      include: virtualBackgroundTemplateInclude,
    });
    return templates.map((template) => this.toSummary(template));
  }

  async listByIds(ids: string[]): Promise<VirtualBackgroundTemplateSummary[]> {
    if (ids.length === 0) {
      return [];
    }
    const templates = await this.prisma.virtualBackgroundTemplate.findMany({
      where: { id: { in: ids } },
      orderBy: { order: 'asc' },
      include: virtualBackgroundTemplateInclude,
    });
    return templates.map((template) => this.toSummary(template));
  }

  async create(
    dto: CreateVirtualBackgroundTemplateDto,
    file: Express.Multer.File,
  ): Promise<VirtualBackgroundTemplateSummary> {
    const currentCount = await this.prisma.virtualBackgroundTemplate.count();
    if (currentCount >= VIRTUAL_BACKGROUND_MAX_TEMPLATES) {
      throw new ConflictException(
        VIRTUAL_BACKGROUND_TEMPLATE_LIMIT_REACHED_MESSAGE,
      );
    }
    await assertVirtualBackgroundImageDimensions(file.buffer);

    const media = await this.mediaService.upload({
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      extension: extname(file.originalname).slice(1).toLowerCase(),
      keyPrefix: VIRTUAL_BACKGROUND_TEMPLATE_STORAGE_KEY_PREFIX,
    });

    const template = await this.prisma.virtualBackgroundTemplate.create({
      data: { name: dto.name, mediaId: media.id, order: currentCount },
      include: virtualBackgroundTemplateInclude,
    });

    return this.toSummary(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.prisma.virtualBackgroundTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(
        VIRTUAL_BACKGROUND_TEMPLATE_NOT_FOUND_MESSAGE,
      );
    }
    // Deleting the Media row cascades away the VirtualBackgroundTemplate row
    // itself (and any plan whitelist entries pointing at it).
    await this.mediaService.delete(template.mediaId);
  }

  private toSummary(
    template: TemplateWithMedia,
  ): VirtualBackgroundTemplateSummary {
    return {
      id: template.id,
      name: template.name,
      order: template.order,
      imageUrl: this.mediaService.getPublicUrl(template.media),
    };
  }
}
