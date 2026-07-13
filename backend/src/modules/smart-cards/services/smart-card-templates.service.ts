import { Injectable } from '@nestjs/common';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SmartCardTemplateKey } from '../../../generated/prisma/client';

export interface SmartCardTemplateSummary {
  id: string;
  key: SmartCardTemplateKey;
  name: string;
  previewImageUrl: string | null;
}

@Injectable()
export class SmartCardTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async list(): Promise<SmartCardTemplateSummary[]> {
    const templates = await this.prisma.smartCardTemplate.findMany({
      include: { previewMedia: true },
      orderBy: { createdAt: 'asc' },
    });
    return templates.map((template) => this.toSummary(template));
  }

  async getByKey(key: SmartCardTemplateKey): Promise<SmartCardTemplateSummary> {
    const template = await this.prisma.smartCardTemplate.findUniqueOrThrow({
      where: { key },
      include: { previewMedia: true },
    });
    return this.toSummary(template);
  }

  private toSummary(template: {
    id: string;
    key: SmartCardTemplateKey;
    name: string;
    previewMedia: Parameters<MediaService['getPublicUrl']>[0] | null;
  }): SmartCardTemplateSummary {
    return {
      id: template.id,
      key: template.key,
      name: template.name,
      previewImageUrl: template.previewMedia
        ? this.mediaService.getPublicUrl(template.previewMedia)
        : null,
    };
  }
}
