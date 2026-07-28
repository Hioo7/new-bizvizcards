// Case-insensitive: pre-existing e-card endpoints from a dry-run migration
// (run before the real migration onto this schema) contain uppercase
// characters, so the format check must keep accepting those rather than
// locking existing customers out of editing their own card.
export const URL_SLUG_REGEX = /^[a-zA-Z0-9-]+$/;
export const URL_SLUG_MIN_LENGTH = 3;
export const URL_SLUG_MAX_LENGTH = 80;
