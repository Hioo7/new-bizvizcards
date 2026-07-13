import { Provider } from '@nestjs/common';
import { MediaSource } from '../../../generated/prisma/client';
import { MediaStorageProvider } from './media-storage-provider.interface';
import { MinioMediaStorageProvider } from './minio-media-storage-provider.service';
import { MEDIA_STORAGE_PROVIDER_REGISTRY } from './storage.constants';

export type MediaStorageProviderRegistry = Record<
  MediaSource,
  MediaStorageProvider
>;

export const mediaStorageProviderRegistryProvider: Provider = {
  provide: MEDIA_STORAGE_PROVIDER_REGISTRY,
  useFactory: (
    minioProvider: MinioMediaStorageProvider,
  ): MediaStorageProviderRegistry => ({
    [MediaSource.MINIO]: minioProvider,
  }),
  inject: [MinioMediaStorageProvider],
};
