import { UnsupportedMediaTypeException } from '@nestjs/common';
import sharp from 'sharp';
import {
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_UNDERSIZED_IMAGE_MESSAGE,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from '../virtual-backgrounds.constants';

/** Shared by the template-library upload (fast admin feedback) and the
 * composer's own base-image preparation — a base image smaller than the
 * target in either dimension can never be used, whether it's a shared-
 * library template or a customer's custom upload. */
export async function assertVirtualBackgroundImageDimensions(
  buffer: Buffer,
): Promise<void> {
  const metadata = await sharp(buffer).metadata();
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width < VIRTUAL_BACKGROUND_WIDTH_PX ||
    metadata.height < VIRTUAL_BACKGROUND_HEIGHT_PX
  ) {
    throw new UnsupportedMediaTypeException(
      VIRTUAL_BACKGROUND_UNDERSIZED_IMAGE_MESSAGE,
    );
  }
}
