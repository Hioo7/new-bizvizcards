import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'path';
import {
  ECARD_BROCHURE_ALLOWED_EXTENSIONS,
  ECARD_BROCHURE_ALLOWED_MIME_TYPE_PATTERN,
  ECARD_BROCHURE_FIELD,
  ECARD_BROCHURE_MAX_SIZE_BYTES,
  ECARD_IMAGE_ALLOWED_EXTENSIONS,
  ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  ECARD_IMAGE_MAX_SIZE_BYTES,
} from '../ecards.constants';

interface FileRules {
  allowedExtensions: string[];
  allowedMimeTypePattern: RegExp;
  maxSizeBytes: number;
}

const IMAGE_RULES: FileRules = {
  allowedExtensions: ECARD_IMAGE_ALLOWED_EXTENSIONS,
  allowedMimeTypePattern: ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  maxSizeBytes: ECARD_IMAGE_MAX_SIZE_BYTES,
};

const BROCHURE_RULES: FileRules = {
  allowedExtensions: ECARD_BROCHURE_ALLOWED_EXTENSIONS,
  allowedMimeTypePattern: ECARD_BROCHURE_ALLOWED_MIME_TYPE_PATTERN,
  maxSizeBytes: ECARD_BROCHURE_MAX_SIZE_BYTES,
};

/** A single request can carry both image parts (hero/gallery) and the
 * brochure PDF part, each with different validity rules — dispatch on field
 * name rather than applying one blanket rule to every file. */
export function assertValidEcardFiles(files: Express.Multer.File[]): void {
  for (const file of files) {
    const rules =
      file.fieldname === ECARD_BROCHURE_FIELD ? BROCHURE_RULES : IMAGE_RULES;

    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (
      !rules.allowedExtensions.includes(extension) ||
      !rules.allowedMimeTypePattern.test(file.mimetype)
    ) {
      throw new UnsupportedMediaTypeException();
    }
    if (file.size > rules.maxSizeBytes) {
      throw new PayloadTooLargeException();
    }
  }
}
