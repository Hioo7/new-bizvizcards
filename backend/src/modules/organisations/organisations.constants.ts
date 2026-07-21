export const ORGANISATION_NAME_MAX_LENGTH = 150;
export const ORGANISATION_MAX_MEMBERS = 200;

// A sanity guardrail against unbounded creation, not a product-mandated
// limit — a customer can now belong to (or create) multiple organisations.
export const ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER = 10;

export const ORGANISATION_LIST_DEFAULT_PAGE = 1;
export const ORGANISATION_LIST_DEFAULT_PAGE_SIZE = 20;
export const ORGANISATION_LIST_MAX_PAGE_SIZE = 100;

export const ORGANISATION_EMAIL_MAX_LENGTH = 254;
export const ORGANISATION_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ORGANISATION_INVITE_TOKEN_BYTES = 32;
export const ORGANISATION_INVITE_EXPIRY_HOURS = 72;
export const ORGANISATION_INVITE_EMAIL_SUBJECT =
  "You've been invited to join an organisation";

export const ORGANISATION_SEARCH_MAX_LENGTH = 150;

export const ORGANISATION_LOGO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const ORGANISATION_LOGO_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
];
export const ORGANISATION_LOGO_ALLOWED_MIME_TYPE_PATTERN =
  /^image\/(jpeg|png|webp)$/;
export const ORGANISATION_LOGO_STORAGE_KEY_PREFIX = 'organisation-logo';

// Per-request cap on a single bulk-add-members call — a sanity guardrail on
// payload size, independent of ORGANISATION_MAX_MEMBERS (the org-wide cap).
export const ORGANISATION_BULK_ADD_MEMBERS_MAX_PER_REQUEST = 100;

// Organisation e-card template — multipart field-name/storage-key
// conventions mirroring ecards.constants.ts's own ECARD_* equivalents.
export const ORGANISATION_ECARD_TEMPLATE_MULTIPART_DATA_FIELD = 'data';
export const ORGANISATION_ECARD_TEMPLATE_HERO_PHOTO_FIELD = 'heroProfilePhoto';
export const ORGANISATION_ECARD_TEMPLATE_GALLERY_IMAGE_FIELD_PREFIX =
  'galleryImage_';
export const ORGANISATION_ECARD_TEMPLATE_BROCHURE_FIELD = 'brochurePdf';

export function organisationEcardTemplateGalleryImageField(
  subGalleryIndex: number,
  imageIndex: number,
): string {
  return `${ORGANISATION_ECARD_TEMPLATE_GALLERY_IMAGE_FIELD_PREFIX}${subGalleryIndex}_${imageIndex}`;
}

export const ORGANISATION_ECARD_TEMPLATE_STORAGE_KEY_PREFIX =
  'organisation-ecard-templates';
