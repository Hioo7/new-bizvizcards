import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ImageMediaModel } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_IMAGE_SOURCE } from './media.constants';
import type { ImageStorageProviderRegistry } from './storage/image-storage-provider-registry.provider';
import { IMAGE_STORAGE_PROVIDER_REGISTRY } from './storage/storage.constants';

export interface UploadImageMediaParams {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  extension: string;
  keyPrefix: string;
}

@Injectable()
export class ImageMediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(IMAGE_STORAGE_PROVIDER_REGISTRY)
    private readonly providers: ImageStorageProviderRegistry,
  ) {}

  async upload(params: UploadImageMediaParams): Promise<ImageMediaModel> {
    const id = randomUUID();
    const key = `${params.keyPrefix}/${id}.${params.extension}`;

    await this.providers[DEFAULT_IMAGE_SOURCE].upload({
      key,
      buffer: params.buffer,
      contentType: params.contentType,
    });

    return this.prisma.imageMedia.create({
      data: {
        id,
        source: DEFAULT_IMAGE_SOURCE,
        storageKey: key,
        originalName: params.originalName,
        extension: params.extension,
      },
    });
  }

  async delete(imageMediaId: string): Promise<void> {
    const imageMedia = await this.prisma.imageMedia.findUniqueOrThrow({
      where: { id: imageMediaId },
    });

    await this.providers[imageMedia.source].delete(imageMedia.storageKey);
    await this.prisma.imageMedia.delete({ where: { id: imageMediaId } });
  }

  getPublicUrl(
    imageMedia: Pick<ImageMediaModel, 'source' | 'storageKey'>,
  ): string {
    return this.providers[imageMedia.source].getPublicUrl(
      imageMedia.storageKey,
    );
  }

  /** For well-known static assets seeded directly into storage (e.g. a default
   * fallback image) that have no corresponding ImageMedia DB row. */
  getPublicUrlForKey(key: string): string {
    return this.providers[DEFAULT_IMAGE_SOURCE].getPublicUrl(key);
  }
}
