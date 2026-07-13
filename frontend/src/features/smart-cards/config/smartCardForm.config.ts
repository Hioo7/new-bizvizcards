export const SMART_CARD_TEXT_SHORT_MAX_LENGTH = 150;
export const SMART_CARD_TEXT_MEDIUM_MAX_LENGTH = 500;
export const SMART_CARD_TEXT_LONG_MAX_LENGTH = 5000;

export const SMART_CARD_ENDPOINT_MIN_LENGTH = 3;
export const SMART_CARD_ENDPOINT_MAX_LENGTH = 80;
export const SMART_CARD_ENDPOINT_REGEX = /^[a-z0-9-]+$/;

export const SMART_CARD_SATISFACTION_MAX = 100;

export const SMART_CARD_MAX_SERVICES = 20;
export const SMART_CARD_MAX_TESTIMONIALS = 20;
export const SMART_CARD_MAX_GALLERIES = 10;
export const SMART_CARD_MAX_GALLERY_IMAGES = 30;

export const SMART_CARD_LIST_PAGE_SIZE = 20;
export const SMART_CARD_LIST_SEARCH_DEBOUNCE_MS = 350;

export type SmartCardFormStepId =
  | "customer"
  | "profile"
  | "contact"
  | "social"
  | "founder"
  | "services"
  | "testimonials"
  | "gallery";
