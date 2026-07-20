import { SmartCardTemplateKey } from '../../generated/prisma/client';

// Legacy source table names — passed to LegacyIdMapperService as
// `sourceTable`, matching the `@@map()` table name in
// prisma/legacy-schema/legacy.prisma exactly.
export const MIGRATION_SOURCE_TABLE = {
  USER: 'User',
  CARD_USER: 'CardUser',
  ECARD: 'ECard',
  CARD_USER_LEAD: 'CardUserLead',
  LEAD_FOLDER: 'LeadFolder',
  SMART_CARD: 'SmartCard',
  ORGANISATION: 'Organisation',
  ORGANISATION_MEMBER: 'OrganisationMember',
  RESTRICTED_ROUTE: 'RestrictedRoute',
  REDIRECT_ROUTE: 'RedirectRoute',
  EXTERNAL_REDIRECT_ROUTE: 'ExternalRedirectRoute',
  // Media isn't tracked per source row id alone — a single legacy row can
  // reference multiple images (e.g. SmartCardFounder.imageUrl vs a gallery
  // image), so MEDIA-domain sourceTable values are qualified by field, e.g.
  // "ECard.imageUrl", to keep the (domain, sourceTable, sourceId) unique key
  // meaningful per distinct image reference.
  ECARD_IMAGE: 'ECard.imageUrl',
  SMART_CARD_PROFILE_LOGO: 'SmartCardProfile.logoUrl',
  SMART_CARD_FOUNDER_IMAGE: 'SmartCardFounder.imageUrl',
  SMART_CARD_SERVICE_IMAGE: 'SmartCardService.imageUrl',
  SMART_CARD_GALLERY_IMAGE: 'SmartCardGalleryImage.url',
} as const;

// Legacy SmartCardTemplate.slug -> new SmartCardTemplateKey. Only two slugs
// existed in legacy production at research time (interior.design.template,
// interior.design.template2) — INTERIOR_DESIGN_TEMPLATE_3 is new-app-only,
// no legacy source. Any other/unrecognized slug is rejected, see
// MIGRATION_REJECTION_REASON.UNRECOGNIZED_TEMPLATE_SLUG.
export const SMART_CARD_TEMPLATE_SLUG_MAP: Record<
  string,
  SmartCardTemplateKey
> = {
  'interior.design.template': SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
  'interior.design.template2': SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2,
};

// Rejection/skip reasons — every MigrationRecord.reason value is one of
// these named constants, never an inline string, so the admin UI's
// drill-down report and this codebase both have one source of truth for
// what a given reason means.
export const MIGRATION_REJECTION_REASON = {
  // Generic, any domain
  UNEXPECTED_DATABASE_ERROR: 'UNEXPECTED_DATABASE_ERROR',
  UNIQUE_CONSTRAINT_CONFLICT: 'UNIQUE_CONSTRAINT_CONFLICT',

  // STAFF_IDENTITY
  EMPLOYEE_EMAIL_ALREADY_EXISTS_IN_TARGET:
    'EMPLOYEE_EMAIL_ALREADY_EXISTS_IN_TARGET',

  // CUSTOMER_IDENTITY
  EMAIL_ALREADY_EXISTS_IN_TARGET: 'EMAIL_ALREADY_EXISTS_IN_TARGET',
  EMAIL_INVALID_OR_EMPTY: 'EMAIL_INVALID_OR_EMPTY',
  FALLBACK_PLAN_NOT_CONFIGURED: 'FALLBACK_PLAN_NOT_CONFIGURED',

  // ORGANISATION / ORGANISATION_MEMBER
  OWNING_ORGANISATION_NOT_MIGRATED: 'OWNING_ORGANISATION_NOT_MIGRATED',
  MEMBER_CUSTOMER_NOT_MIGRATED: 'MEMBER_CUSTOMER_NOT_MIGRATED',
  DUPLICATE_MEMBERSHIP: 'DUPLICATE_MEMBERSHIP',

  // SMART_CARD
  ENDPOINT_ALREADY_TAKEN: 'ENDPOINT_ALREADY_TAKEN',
  UNRECOGNIZED_TEMPLATE_SLUG: 'UNRECOGNIZED_TEMPLATE_SLUG',
  OWNER_NOT_MIGRATED_CARD_UNASSIGNED: 'OWNER_NOT_MIGRATED_CARD_UNASSIGNED',

  // ECARD
  OWNING_CUSTOMER_NOT_MIGRATED: 'OWNING_CUSTOMER_NOT_MIGRATED',
  WHATSAPP_NUMBER_UNPARSEABLE: 'WHATSAPP_NUMBER_UNPARSEABLE',
  PROFILE_PHOTO_TRANSFER_FAILED: 'PROFILE_PHOTO_TRANSFER_FAILED',

  // LEAD_FOLDER / LEAD
  // (reuses OWNING_CUSTOMER_NOT_MIGRATED above)

  // MEDIA — never rejects the owning row, only logged as a note
  MEDIA_URL_UNREACHABLE: 'MEDIA_URL_UNREACHABLE',
  MEDIA_NON_IMAGE_CONTENT_TYPE: 'MEDIA_NON_IMAGE_CONTENT_TYPE',
  MEDIA_UPLOAD_FAILED: 'MEDIA_UPLOAD_FAILED',
  NO_MEDIA_REFERENCE: 'NO_MEDIA_REFERENCE',

  // RESTRICTED_ROUTE
  RESTRICTED_PATH_ALREADY_TAKEN: 'RESTRICTED_PATH_ALREADY_TAKEN',

  // INTERNAL_REDIRECT / EXTERNAL_REDIRECT
  SOURCE_PATH_ALREADY_TAKEN: 'SOURCE_PATH_ALREADY_TAKEN',
} as const;

export type MigrationRejectionReason =
  (typeof MIGRATION_REJECTION_REASON)[keyof typeof MIGRATION_REJECTION_REASON];

// Pre-flight check identifiers — shared shape between the backend response
// and the frontend's checklist rendering.
export const MIGRATION_PREFLIGHT_CHECK_ID = {
  LEGACY_DATABASE_CONNECTIVITY: 'LEGACY_DATABASE_CONNECTIVITY',
  LEGACY_MEDIA_STAGING_CONNECTIVITY: 'LEGACY_MEDIA_STAGING_CONNECTIVITY',
  FALLBACK_PLAN_CONFIGURED: 'FALLBACK_PLAN_CONFIGURED',
  SMART_CARD_TEMPLATES_SEEDED: 'SMART_CARD_TEMPLATES_SEEDED',
} as const;

export type MigrationPreflightCheckId =
  (typeof MIGRATION_PREFLIGHT_CHECK_ID)[keyof typeof MIGRATION_PREFLIGHT_CHECK_ID];

// Human-readable label shown per row in the frontend's pre-flight
// checklist — kept here (not hardcoded in the service or the frontend) so
// backend and frontend never drift on what a check id means.
export const MIGRATION_PREFLIGHT_CHECK_LABEL: Record<
  MigrationPreflightCheckId,
  string
> = {
  [MIGRATION_PREFLIGHT_CHECK_ID.LEGACY_DATABASE_CONNECTIVITY]:
    'Legacy database connection',
  [MIGRATION_PREFLIGHT_CHECK_ID.LEGACY_MEDIA_STAGING_CONNECTIVITY]:
    'Legacy media staging bucket',
  [MIGRATION_PREFLIGHT_CHECK_ID.FALLBACK_PLAN_CONFIGURED]:
    'Fallback plan seeded',
  [MIGRATION_PREFLIGHT_CHECK_ID.SMART_CARD_TEMPLATES_SEEDED]:
    'Smart card templates seeded',
};

// Legacy rows are fetched and processed in batches of this size (not all at
// once) — bounds memory use for the larger domains (hundreds of CardUsers/
// ECards) while still processing rows one at a time within a batch, per-row
// progress persisted immediately (see LegacyIdMapperService).
export const MIGRATION_BATCH_SIZE = 200;

export const MIGRATION_LIST_DEFAULT_PAGE = 1;
export const MIGRATION_LIST_DEFAULT_PAGE_SIZE = 25;
export const MIGRATION_LIST_MAX_PAGE_SIZE = 100;

// Timeout for any single network call the migration makes against the
// legacy DB tunnel / staging media bucket / third-party CDN — short enough
// that a dead SSH tunnel fails a pre-flight check or a migrator step fast
// instead of hanging the whole job.
export const MIGRATION_NETWORK_TIMEOUT_MS = 8_000;

// Key prefix used when re-uploading transferred legacy media through the
// existing MediaService, namespacing migrated assets from ones uploaded
// through normal app usage.
export const MIGRATION_MEDIA_KEY_PREFIX = 'migration';

// Legacy media is images only (confirmed in research: legacy's upload
// routes whitelist exactly these MIME types, no PDF/video ever went through
// its Media system) — used to validate a fetched legacy asset's
// Content-Type before re-uploading it, and to derive the file extension
// MediaService.upload() needs.
export const MIGRATION_MEDIA_CONTENT_TYPE_EXTENSION: Record<string, string> = {
  'image/avif': 'avif',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};
