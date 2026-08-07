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
  "VIDEO_GALLERY",
  "TEAM",
  "WHATSAPP",
  "BROCHURE",
  "LOCATION_TILE",
  "REVIEW_LINK",
  "TESTIMONIALS",
] as const;

export const ECARD_COMPONENT_LABELS: Record<
  (typeof ECARD_COMPONENT_TYPES)[number],
  string
> = {
  ABOUT: "About",
  SOCIAL_LINKS: "Social links",
  GALLERY: "Gallery",
  VIDEO: "Video",
  VIDEO_GALLERY: "Video Gallery",
  TEAM: "Team",
  WHATSAPP: "WhatsApp",
  BROCHURE: "Brochure",
  LOCATION_TILE: "Location",
  REVIEW_LINK: "Review link",
  TESTIMONIALS: "Testimonials",
};

// DEFAULT is never included — it's always available and never a toggle in
// this grid, mirroring the backend's ECARD_GATED_HERO_LAYOUTS.
export const ECARD_GATED_HERO_LAYOUTS = [
  "BANNER",
  "BANNER_PROFILE",
  "ORG_BADGE",
] as const;

export const ECARD_HERO_LAYOUT_LABELS: Record<
  (typeof ECARD_GATED_HERO_LAYOUTS)[number],
  string
> = {
  BANNER: "Banner",
  BANNER_PROFILE: "Banner + Profile",
  ORG_BADGE: "Org Badge",
};

// DEFAULT_DARK is never included — it's always available and never a toggle
// in this grid, mirroring the backend's ECARD_GATED_THEMES.
export const ECARD_GATED_THEMES = ["LIGHT", "NAVY_TEAL"] as const;

export const ECARD_THEME_LABELS: Record<
  (typeof ECARD_GATED_THEMES)[number],
  string
> = {
  LIGHT: "Light",
  NAVY_TEAL: "Navy Teal",
};

// CIRCLE is never included — same convention as ECARD_GATED_THEMES above,
// mirroring the backend's ECARD_GATED_ICON_SHAPES.
export const ECARD_GATED_ICON_SHAPES = [
  "SQUIRCLE",
  "ROUNDED_SQUARE",
  "TEARDROP",
] as const;

export const ECARD_ICON_SHAPE_LABELS: Record<
  (typeof ECARD_GATED_ICON_SHAPES)[number],
  string
> = {
  SQUIRCLE: "Squircle",
  ROUNDED_SQUARE: "Rounded square",
  TEARDROP: "Teardrop",
};

// A sanity guardrail on the admin-authored preset list per plan, mirroring
// the backend's ECARD_MAX_ACCENT_COLOR_PRESETS.
export const ECARD_MAX_ACCENT_COLOR_PRESETS = 20;

// Mirrors the backend's DEFAULT_ECARD_ACCENT_COLOR_PRESETS exactly — used to
// pre-populate a brand-new plan's draft so it starts with sensible presets
// out of the box (editable/removable, not hardcoded once saved).
export const DEFAULT_ECARD_ACCENT_COLOR_PRESETS = [
  { themeAffinity: "DARK", primaryColor: "#38bdf8", secondaryColor: "#818cf8" },
  { themeAffinity: "DARK", primaryColor: "#34d399", secondaryColor: "#2dd4bf" },
  { themeAffinity: "DARK", primaryColor: "#fbbf24", secondaryColor: "#fb923c" },
  { themeAffinity: "DARK", primaryColor: "#fb7185", secondaryColor: "#f472b6" },
  { themeAffinity: "LIGHT", primaryColor: "#2563eb", secondaryColor: "#4f46e5" },
  { themeAffinity: "LIGHT", primaryColor: "#059669", secondaryColor: "#0d9488" },
  { themeAffinity: "LIGHT", primaryColor: "#d97706", secondaryColor: "#ea580c" },
  { themeAffinity: "LIGHT", primaryColor: "#e11d48", secondaryColor: "#db2777" },
] as const;

// Sensible starting point for a new component's gallery limits — an admin
// building a new plan can adjust these before saving.
export const DEFAULT_GALLERY_LIMITS = {
  maxGalleries: 3,
  maxImagesPerGallery: 10,
  maxGallerySizeBytes: 10 * 1024 * 1024,
};

// Same starting-point convention as DEFAULT_GALLERY_LIMITS, minus a
// file-size dimension — video gallery entries are URLs, not uploads.
export const DEFAULT_VIDEO_GALLERY_LIMITS = {
  maxVideoGalleries: 3,
  maxVideosPerGallery: 10,
};

// Sensible starting point for a new plan's custom-form cap — an admin
// building a new plan can adjust before saving, mirrors DEFAULT_GALLERY_LIMITS.
export const DEFAULT_MAX_CUSTOM_FORMS = 5;

// Same starting-point convention, for a new plan's email signature cap.
export const DEFAULT_MAX_EMAIL_SIGNATURES = 5;

export const PLAN_FORM_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "ecard", label: "E-card" },
  { id: "smart-card", label: "Smart card" },
  { id: "organisation", label: "Organisation" },
  { id: "event", label: "Events" },
  { id: "email-signature", label: "Email Signatures" },
  { id: "virtual-background", label: "Virtual Backgrounds" },
  { id: "review", label: "Review" },
] as const;
