export const PLAN_NAME_MAX_LENGTH = 150;

// Sanity bound on price — not a product-mandated ceiling, just guards
// against a typo entering an absurd value (price/isPublic are inert this
// pass, no live checkout reads them yet).
export const PLAN_PRICE_MAX = 1_000_000;

export const PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS = 1;
export const PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS = 60;

export const PLAN_LIST_DEFAULT_PAGE = 1;
export const PLAN_LIST_DEFAULT_PAGE_SIZE = 20;
export const PLAN_LIST_MAX_PAGE_SIZE = 100;
export const PLAN_SEARCH_MAX_LENGTH = 150;

export const PLAN_BAN_REASON_MAX_LENGTH = 500;

// Fallback plan seed defaults (also imported by
// prisma/scripts/seed-fallback-plan.ts so the values aren't duplicated).
export const PLAN_FALLBACK_NAME = 'Free (Fallback)';
export const PLAN_FALLBACK_MAX_ECARDS = 1;
export const PLAN_FALLBACK_MAX_SMART_CARDS = 0;
export const PLAN_FALLBACK_MAX_GALLERIES = 1;
export const PLAN_FALLBACK_MAX_IMAGES_PER_GALLERY = 5;
export const PLAN_FALLBACK_MAX_GALLERY_SIZE_BYTES = 5 * 1024 * 1024;
export const PLAN_FALLBACK_MAX_ORGS_CAN_JOIN = 1;
export const PLAN_FALLBACK_MAX_ORGS_CAN_CREATE = 0;
export const PLAN_FALLBACK_MAX_EVENTS = 0;
export const PLAN_FALLBACK_MAX_GUESTS_PER_EVENT = 0;

// An empty SmartCardPolicy.whitelistedTemplates means no templates are
// permitted (strict allowlist) — not "no restriction". Documented here since
// it's read from multiple places (resolver + enforcement service).
export const PLAN_EMPTY_TEMPLATE_WHITELIST_MEANS_NONE_ALLOWED = true;

export const PLAN_NOT_FOUND_MESSAGE = 'Plan not found';
export const PLAN_FALLBACK_PLAN_MISSING_MESSAGE =
  'No fallback plan is configured for the system';
export const PLAN_DELETE_ORPHAN_ONLY_MESSAGE =
  'This plan cannot be deleted while it is still in use';
export const PLAN_TRIAL_ALREADY_USED_MESSAGE =
  'This customer has already used this trial plan';
export const PLAN_ASSIGN_ALREADY_ACTIVE_MESSAGE =
  'This customer already has an active plan — use switch instead';
export const PLAN_SWITCH_REQUIRES_ACTIVE_MESSAGE =
  'This customer has no active plan to switch — use assign instead';
export const PLAN_RENEW_REQUIRES_ACTIVE_MESSAGE =
  'This customer has no active plan to renew';
export const PLAN_BULK_ASSIGN_INVALID_CUSTOMER_IDS_MESSAGE =
  'One or more customerIds do not reference an existing customer';

// Mirrors ORGANISATION_BULK_ADD_MEMBERS_MAX_PER_REQUEST — same batch-size
// rationale, kept as its own constant since the two features are unrelated.
export const PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST = 100;

export const PLAN_ECARD_NOT_AVAILABLE_MESSAGE =
  "This customer's plan does not include e-cards";
export const PLAN_ECARD_LIMIT_REACHED_MESSAGE =
  "This customer's plan has reached its e-card limit";
export const PLAN_GALLERY_LIMIT_REACHED_MESSAGE =
  "This customer's plan has reached its gallery limit for this e-card";
export const PLAN_SMART_CARD_NOT_AVAILABLE_MESSAGE =
  "This customer's plan does not include smart cards";
export const PLAN_SMART_CARD_LIMIT_REACHED_MESSAGE =
  "This customer's plan has reached its smart card limit";
export const PLAN_SMART_CARD_TEMPLATE_NOT_ALLOWED_MESSAGE =
  "This customer's plan does not allow this smart card template";
export const PLAN_EXCHANGE_CONTACT_NOT_ALLOWED_MESSAGE =
  "This customer's plan does not include exchange contact";
export const PLAN_ORGANISATION_NOT_AVAILABLE_MESSAGE =
  "This customer's plan does not include organisations";
export const PLAN_ORGANISATION_JOIN_LIMIT_MESSAGE =
  "This customer's plan has reached its organisation-membership limit";
export const PLAN_ORGANISATION_CREATE_LIMIT_MESSAGE =
  "This customer's plan has reached its organisation-creation limit";
export const PLAN_EVENT_NOT_AVAILABLE_MESSAGE =
  "This customer's plan does not include business events";
export const PLAN_EVENT_LIMIT_REACHED_MESSAGE =
  "This customer's plan has reached its event limit";
export const PLAN_EVENT_GUEST_LIMIT_REACHED_MESSAGE =
  "This event's host plan has reached its guest limit for this event";
