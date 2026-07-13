import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { MediaModel } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_MEDIA_SOURCE } from './media.constants';
import type { MediaStorageProviderRegistry } from './storage/media-storage-provider-registry.provider';
import { MEDIA_STORAGE_PROVIDER_REGISTRY } from './storage/storage.constants';

export interface UploadMediaFileParams {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  extension: string;
  keyPrefix: string;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE_PROVIDER_REGISTRY)
    private readonly providers: MediaStorageProviderRegistry,
  ) {}

  async upload(params: UploadMediaFileParams): Promise<MediaModel> {
    const id = randomUUID();
    const key = `${params.keyPrefix}/${id}.${params.extension}`;

    await this.providers[DEFAULT_MEDIA_SOURCE].upload({
      key,
      buffer: params.buffer,
      contentType: params.contentType,
    });

    return this.prisma.media.create({
      data: {
        id,
        source: DEFAULT_MEDIA_SOURCE,
        storageKey: key,
        originalName: params.originalName,
        extension: params.extension,
      },
    });
  }

  async delete(mediaId: string): Promise<void> {
    const media = await this.prisma.media.findUniqueOrThrow({
      where: { id: mediaId },
    });

    await this.providers[media.source].delete(media.storageKey);
    await this.prisma.media.delete({ where: { id: mediaId } });
  }

  getPublicUrl(media: Pick<MediaModel, 'source' | 'storageKey'>): string {
    return this.providers[media.source].getPublicUrl(media.storageKey);
  }

  /** For well-known static assets seeded directly into storage (e.g. a default
   * fallback image) that have no corresponding Media DB row. */
  getPublicUrlForKey(key: string): string {
    return this.providers[DEFAULT_MEDIA_SOURCE].getPublicUrl(key);
  }
}
