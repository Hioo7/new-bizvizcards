import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'path';
import {
  ECARD_BROCHURE_ALLOWED_EXTENSIONS,
  ECARD_BROCHURE_ALLOWED_MIME_TYPE_PATTERN,
  ECARD_BROCHURE_MAX_SIZE_BYTES,
  ECARD_IMAGE_ALLOWED_EXTENSIONS,
  ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  ECARD_IMAGE_MAX_SIZE_BYTES,
} from '../../ecards/ecards.constants';
import { ORGANISATION_ECARD_TEMPLATE_BROCHURE_FIELD } from '../organisations.constants';

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

/** Mirrors assertValidEcardFiles — same image-vs-brochure file rules, reused
 * verbatim (they're about physical file properties, not e-card-specific),
 * dispatched by the organisation e-card template's own field-name constant. */
export function assertValidOrganisationEcardTemplateFiles(
  files: Express.Multer.File[],
): void {
  for (const file of files) {
    const rules =
      file.fieldname === ORGANISATION_ECARD_TEMPLATE_BROCHURE_FIELD
        ? BROCHURE_RULES
        : IMAGE_RULES;

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
