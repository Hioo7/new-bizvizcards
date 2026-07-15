export const PFP_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PFP_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const PFP_ALLOWED_MIME_TYPE_PATTERN = /^image\/(jpeg|png|webp)$/;

export const PFP_STORAGE_KEY_PREFIX = 'pfp';

export const CUSTOMER_LIST_DEFAULT_PAGE = 1;
export const CUSTOMER_LIST_DEFAULT_PAGE_SIZE = 20;
export const CUSTOMER_LIST_MAX_PAGE_SIZE = 100;
export const CUSTOMER_SEARCH_MAX_LENGTH = 120;

export const CUSTOMER_NAME_MAX_LENGTH = 120;

// Mirrors better-auth's own emailAndPassword defaults (customer-auth.factory.ts
// doesn't override minPasswordLength/maxPasswordLength).
export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;
export const CUSTOMER_PASSWORD_MAX_LENGTH = 128;

export const CUSTOMER_BAN_REASON_MAX_LENGTH = 500;
export const CUSTOMER_DEFAULT_BAN_REASON = 'No reason provided';
