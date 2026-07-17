export const PRODUCT_NAME_MAX_LENGTH = 150;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 2000;
export const PRODUCT_PRICE_MAX = 1_000_000;

export const PRODUCT_VARIANT_NAME_MAX_LENGTH = 150;
export const PRODUCT_VARIANT_SKU_MAX_LENGTH = 64;

export const PRODUCT_LIST_DEFAULT_PAGE = 1;
export const PRODUCT_LIST_DEFAULT_PAGE_SIZE = 20;
export const PRODUCT_LIST_MAX_PAGE_SIZE = 100;

export const PRODUCT_UNIT_LIST_DEFAULT_PAGE = 1;
export const PRODUCT_UNIT_LIST_DEFAULT_PAGE_SIZE = 50;
export const PRODUCT_UNIT_LIST_MAX_PAGE_SIZE = 500;

// Random per-unit code embedded in the QR/NFC URL. 15 raw bytes -> 20
// base64url characters, comfortably high-entropy against guessing.
export const PRODUCT_UNIT_CODE_RANDOM_BYTES = 15;

// Sanity guardrails against unbounded batch operations, not product-mandated
// limits — comfortably covers a real manufacturing run.
export const PRODUCT_UNIT_GENERATE_MAX_QUANTITY = 5000;
export const PRODUCT_UNIT_PRINT_BATCH_MAX_QUANTITY = 5000;

// Path the frontend mounts the resolver route on — see ProductUnitResolverPage.
export const PRODUCT_UNIT_RESOLVER_PATH_PREFIX = '/p';

export function buildProductUnitResolverUrl(
  publicAppBaseUrl: string,
  code: string,
): string {
  return `${publicAppBaseUrl}${PRODUCT_UNIT_RESOLVER_PATH_PREFIX}/${code}`;
}

export const PRODUCT_MEDIA_MAX_SIZE_BYTES = 8 * 1024 * 1024;
export const PRODUCT_MEDIA_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
];
export const PRODUCT_MEDIA_ALLOWED_MIME_TYPE_PATTERN =
  /^image\/(jpeg|png|webp|gif)$/;
export const PRODUCT_MEDIA_MULTIPART_FILE_FIELD = 'file';
export const PRODUCT_MEDIA_MULTIPART_DATA_FIELD = 'data';

export const PRODUCT_STORAGE_KEY_PREFIX = 'products';

// One PREVIEW media row is allowed per product and per variant — enforced in
// ProductsService before insert.
export const PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE = 30;
