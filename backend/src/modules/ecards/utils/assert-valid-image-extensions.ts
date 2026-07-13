import { UnsupportedMediaTypeException } from '@nestjs/common';
import { extname } from 'path';
import { ECARD_IMAGE_ALLOWED_EXTENSIONS } from '../ecards.constants';

export function assertValidImageExtensions(files: Express.Multer.File[]): void {
  for (const file of files) {
    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (!ECARD_IMAGE_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new UnsupportedMediaTypeException();
    }
  }
}
