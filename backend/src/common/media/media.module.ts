import { Global, Module } from '@nestjs/common';
import { ImageMediaService } from './image-media.service';
import { imageStorageProviderRegistryProvider } from './storage/image-storage-provider-registry.provider';
import { MinioImageStorageProvider } from './storage/minio-image-storage-provider.service';

@Global()
@Module({
  providers: [
    MinioImageStorageProvider,
    imageStorageProviderRegistryProvider,
    ImageMediaService,
  ],
  exports: [ImageMediaService],
})
export class MediaModule {}
