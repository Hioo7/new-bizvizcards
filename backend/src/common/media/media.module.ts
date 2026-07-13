import { Global, Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { mediaStorageProviderRegistryProvider } from './storage/media-storage-provider-registry.provider';
import { MinioMediaStorageProvider } from './storage/minio-media-storage-provider.service';

@Global()
@Module({
  providers: [
    MinioMediaStorageProvider,
    mediaStorageProviderRegistryProvider,
    MediaService,
  ],
  exports: [MediaService],
})
export class MediaModule {}
