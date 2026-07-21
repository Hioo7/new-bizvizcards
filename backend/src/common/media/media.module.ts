import { Global, Module } from '@nestjs/common';
import { MediaSlotResolverService } from './media-slot-resolver.service';
import { MediaService } from './media.service';
import { mediaStorageProviderRegistryProvider } from './storage/media-storage-provider-registry.provider';
import { MinioMediaStorageProvider } from './storage/minio-media-storage-provider.service';

@Global()
@Module({
  providers: [
    MinioMediaStorageProvider,
    mediaStorageProviderRegistryProvider,
    MediaService,
    MediaSlotResolverService,
  ],
  exports: [MediaService, MediaSlotResolverService],
})
export class MediaModule {}
