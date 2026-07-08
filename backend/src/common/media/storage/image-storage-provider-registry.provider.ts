import { Provider } from '@nestjs/common';
import { ImageSource } from '../../../generated/prisma/client';
import { ImageStorageProvider } from './image-storage-provider.interface';
import { MinioImageStorageProvider } from './minio-image-storage-provider.service';
import { IMAGE_STORAGE_PROVIDER_REGISTRY } from './storage.constants';

export type ImageStorageProviderRegistry = Record<
  ImageSource,
  ImageStorageProvider
>;

export const imageStorageProviderRegistryProvider: Provider = {
  provide: IMAGE_STORAGE_PROVIDER_REGISTRY,
  useFactory: (
    minioProvider: MinioImageStorageProvider,
  ): ImageStorageProviderRegistry => ({
    [ImageSource.MINIO]: minioProvider,
  }),
  inject: [MinioImageStorageProvider],
};
