export const ECARD_TEXT_SHORT_MAX_LENGTH = 150;
export const ECARD_TEXT_MEDIUM_MAX_LENGTH = 500;
export const ECARD_TEXT_LONG_MAX_LENGTH = 5000;

export const ECARD_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const ECARD_PHONE_NUMBER_MIN_DIGITS = 7;
export const ECARD_PHONE_NUMBER_MAX_DIGITS = 15;
export const ECARD_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

// One instance of each ECardComponentType per card (ABOUT, SOCIAL_LINKS,
// GALLERY, VIDEO, TEAM, WHATSAPP, BROCHURE) — see
// ECardComponent.@@unique([ecardId, type]).
export const ECARD_MAX_COMPONENTS = 7;
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

export const ECARD_BROCHURE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const ECARD_BROCHURE_ALLOWED_EXTENSIONS = ['pdf'];
export const ECARD_BROCHURE_ALLOWED_MIME_TYPE_PATTERN = /^application\/pdf$/;

export const ECARD_MULTIPART_DATA_FIELD = 'data';
export const ECARD_HERO_PHOTO_FIELD = 'heroProfilePhoto';
export const ECARD_GALLERY_IMAGE_FIELD_PREFIX = 'galleryImage_';
export const ECARD_BROCHURE_FIELD = 'brochurePdf';

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

// A sanity guardrail against unbounded creation, not a product-mandated
// limit — comfortably covers "a personal card + a few branded org cards"
// while ruling out runaway/accidental creation.
export const ECARD_MAX_PER_CUSTOMER = 20;

// Shared generic label used wherever an ecard needs a human-readable
// fallback/category name outside its own hero data — e.g. the OG-preview
// fallback title and the Google/Apple Wallet passes' title.
export const ECARD_GENERIC_LABEL = 'Digital Business Card';

// Shared brand color used by both wallet integrations (Google Wallet's
// hexBackgroundColor, Apple Wallet's backgroundColor).
export const ECARD_WALLET_BRAND_COLOR_HEX = '#2D2DE0';
