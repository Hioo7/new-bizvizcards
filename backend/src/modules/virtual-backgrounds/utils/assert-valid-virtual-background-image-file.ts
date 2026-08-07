import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'path';
import {
  VIRTUAL_BACKGROUND_IMAGE_ALLOWED_EXTENSIONS,
  VIRTUAL_BACKGROUND_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  VIRTUAL_BACKGROUND_IMAGE_MAX_SIZE_BYTES,
} from '../virtual-backgrounds.constants';

/** Shared by the employee template-library upload and the customer's
 * custom-background upload — both accept the same image types/size. */
export function assertValidVirtualBackgroundImageFile(
  file: Express.Multer.File,
): void {
  const extension = extname(file.originalname).slice(1).toLowerCase();
  if (
    !VIRTUAL_BACKGROUND_IMAGE_ALLOWED_EXTENSIONS.includes(extension) ||
    !VIRTUAL_BACKGROUND_IMAGE_ALLOWED_MIME_TYPE_PATTERN.test(file.mimetype)
  ) {
    throw new UnsupportedMediaTypeException();
  }
  if (file.size > VIRTUAL_BACKGROUND_IMAGE_MAX_SIZE_BYTES) {
    throw new PayloadTooLargeException();
  }
}
