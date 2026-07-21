// Mirrors backend/src/modules/plans/plans.constants.ts — kept here since
// frontend/backend constants aren't shared across the repo.
export const PLAN_MGMT_LIST_PAGE_SIZE = 20;
export const PLAN_MGMT_SEARCH_DEBOUNCE_MS = 350;
export const PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST = 100;
export const PLAN_NAME_MAX_LENGTH = 150;
export const PLAN_PRICE_MAX = 1_000_000;
export const PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS = 1;
export const PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS = 60;

export const ECARD_COMPONENT_TYPES = [
  "ABOUT",
  "SOCIAL_LINKS",
  "GALLERY",
  "VIDEO",
  "TEAM",
  "WHATSAPP",
  "BROCHURE",
] as const;

export const ECARD_COMPONENT_LABELS: Record<
  (typeof ECARD_COMPONENT_TYPES)[number],
  string
> = {
  ABOUT: "About",
  SOCIAL_LINKS: "Social links",
  GALLERY: "Gallery",
  VIDEO: "Video",
  TEAM: "Team",
  WHATSAPP: "WhatsApp",
  BROCHURE: "Brochure",
};

// Sensible starting point for a new component's gallery limits — an admin
// building a new plan can adjust these before saving.
export const DEFAULT_GALLERY_LIMITS = {
  maxGalleries: 3,
  maxImagesPerGallery: 10,
  maxGallerySizeBytes: 10 * 1024 * 1024,
};

export const PLAN_FORM_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "ecard", label: "E-card" },
  { id: "smart-card", label: "Smart card" },
  { id: "organisation", label: "Organisation" },
  { id: "event", label: "Events" },
  { id: "review", label: "Review" },
] as const;
