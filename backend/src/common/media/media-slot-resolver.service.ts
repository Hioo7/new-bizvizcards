import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaService } from './media.service';
import type {
  CreateImageSlotDto,
  UpdateImageSlotDto,
} from '../validators/image-slot.dto';

// Shared upload-vs-keep-existing-vs-omit resolution for the "image slot"
// pattern used by every multipart write that carries media (e-cards,
// organisation e-card templates, ...) — extracted out of EcardsService once
// a second real consumer of the identical logic existed.
@Injectable()
export class MediaSlotResolverService {
  constructor(private readonly mediaService: MediaService) {}

  buildFileMap(files: Express.Multer.File[]): Map<string, Express.Multer.File> {
    const map = new Map<string, Express.Multer.File>();
    for (const file of files) {
      map.set(file.fieldname, file);
    }
    return map;
  }

  async resolveUploadSlot(
    slot: CreateImageSlotDto | undefined,
    fieldName: string,
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
  ): Promise<string | undefined> {
    if (!slot) return undefined;
    return this.uploadFile(fieldName, fileMap, keyPrefix);
  }

  async resolveUpdateSlot(
    slot: UpdateImageSlotDto | undefined,
    fieldName: string,
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
    existingMediaIds: Set<string>,
  ): Promise<string | undefined> {
    if (!slot) return undefined;
    if (slot.action === 'keep') {
      if (!existingMediaIds.has(slot.mediaId)) {
        throw new BadRequestException(
          'mediaId does not belong to this resource',
        );
      }
      return slot.mediaId;
    }
    return this.uploadFile(fieldName, fileMap, keyPrefix);
  }

  private async uploadFile(
    fieldName: string,
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
  ): Promise<string> {
    const file = fileMap.get(fieldName);
    if (!file) {
      throw new BadRequestException(
        `Missing uploaded file for field "${fieldName}"`,
      );
    }
    const media = await this.mediaService.upload({
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      extension: this.extensionFromFilename(file.originalname),
      keyPrefix,
    });
    return media.id;
  }

  private extensionFromFilename(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}
