export const SMART_CARD_TEXT_SHORT_MAX_LENGTH = 150;
export const SMART_CARD_TEXT_MEDIUM_MAX_LENGTH = 500;
export const SMART_CARD_TEXT_LONG_MAX_LENGTH = 5000;

export const SMART_CARD_SATISFACTION_MAX = 100;

export const SMART_CARD_MAX_SERVICES = 20;
export const SMART_CARD_MAX_TESTIMONIALS = 20;
export const SMART_CARD_MAX_GALLERIES = 10;
export const SMART_CARD_MAX_GALLERY_IMAGES = 30;

export const SMART_CARD_LIST_DEFAULT_PAGE = 1;
export const SMART_CARD_LIST_DEFAULT_PAGE_SIZE = 20;
export const SMART_CARD_LIST_MAX_PAGE_SIZE = 100;

export const SMART_CARD_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const SMART_CARD_IMAGE_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
];
export const SMART_CARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN =
  /^image\/(jpeg|png|webp)$/;

export const SMART_CARD_MULTIPART_DATA_FIELD = 'data';
export const SMART_CARD_PROFILE_LOGO_FIELD = 'profileLogo';
export const SMART_CARD_FOUNDER_IMAGE_FIELD = 'founderImage';
export const SMART_CARD_SERVICE_IMAGE_FIELD_PREFIX = 'serviceImage_';
export const SMART_CARD_GALLERY_IMAGE_FIELD_PREFIX = 'galleryImage_';

export function smartCardServiceImageField(index: number): string {
  return `${SMART_CARD_SERVICE_IMAGE_FIELD_PREFIX}${index}`;
}

export function smartCardGalleryImageField(
  galleryIndex: number,
  imageIndex: number,
): string {
  return `${SMART_CARD_GALLERY_IMAGE_FIELD_PREFIX}${galleryIndex}_${imageIndex}`;
}

export const SMART_CARD_STORAGE_KEY_PREFIX = 'smart-cards';
