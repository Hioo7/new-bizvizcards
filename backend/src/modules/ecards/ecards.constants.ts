export const ECARD_TEXT_SHORT_MAX_LENGTH = 150;
export const ECARD_TEXT_MEDIUM_MAX_LENGTH = 500;
export const ECARD_TEXT_LONG_MAX_LENGTH = 5000;

export const ECARD_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const ECARD_PHONE_NUMBER_MIN_DIGITS = 7;
export const ECARD_PHONE_NUMBER_MAX_DIGITS = 15;
export const ECARD_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

// One instance of each ECardComponentType per card (ABOUT, SOCIAL_LINKS,
// GALLERY, VIDEO, TEAM, WHATSAPP) — see ECardComponent.@@unique([ecardId, type]).
export const ECARD_MAX_COMPONENTS = 6;
export const ECARD_MAX_SUB_GALLERIES = 10;
export const ECARD_MAX_GALLERY_IMAGES = 30;
export const ECARD_MAX_TEAM_MEMBERS = 50;

export const ECARD_VIDEO_URL_MAX_LENGTH = 2048;
// Only known-safe embed hosts are accepted — the stored value is used
// directly as an <iframe src>, never raw iframe HTML, so an open host
// allowlist here is the XSS guard.
export const ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN =
  /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;

export const ECARD_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const ECARD_IMAGE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN = /^image\/(jpeg|png|webp)$/;

export const ECARD_MULTIPART_DATA_FIELD = 'data';
export const ECARD_HERO_PHOTO_FIELD = 'heroProfilePhoto';
export const ECARD_GALLERY_IMAGE_FIELD_PREFIX = 'galleryImage_';

export function ecardGalleryImageField(
  subGalleryIndex: number,
  imageIndex: number,
): string {
  return `${ECARD_GALLERY_IMAGE_FIELD_PREFIX}${subGalleryIndex}_${imageIndex}`;
}

export const ECARD_STORAGE_KEY_PREFIX = 'ecards';

export const ECARD_LIST_DEFAULT_PAGE = 1;
export const ECARD_LIST_DEFAULT_PAGE_SIZE = 20;
export const ECARD_LIST_MAX_PAGE_SIZE = 100;
