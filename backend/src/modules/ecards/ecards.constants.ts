import {
  ECardAccentColorPresetThemeAffinity,
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
} from '../../generated/prisma/client';

export const ECARD_TEXT_SHORT_MAX_LENGTH = 150;
export const ECARD_TEXT_MEDIUM_MAX_LENGTH = 500;
export const ECARD_TEXT_LONG_MAX_LENGTH = 5000;

export const ECARD_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const ECARD_PHONE_NUMBER_MIN_DIGITS = 7;
export const ECARD_PHONE_NUMBER_MAX_DIGITS = 15;
export const ECARD_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

// One instance of each ECardComponentType per card (ABOUT, SOCIAL_LINKS,
// GALLERY, VIDEO, VIDEO_GALLERY, TEAM, WHATSAPP, BROCHURE, LOCATION_TILE,
// REVIEW_LINK, TESTIMONIALS) — see ECardComponent.@@unique([ecardId, type]).
export const ECARD_MAX_COMPONENTS = 11;
export const ECARD_MAX_SUB_GALLERIES = 10;
export const ECARD_MAX_GALLERY_IMAGES = 30;
export const ECARD_MAX_VIDEO_SUB_GALLERIES = 10;
export const ECARD_MAX_VIDEOS_PER_GALLERY = 30;
export const ECARD_MAX_TEAM_MEMBERS = 50;

export const ECARD_LOCATION_TILE_LABEL_MAX_LENGTH = 100;
export const ECARD_LOCATION_LATITUDE_MIN = -90;
export const ECARD_LOCATION_LATITUDE_MAX = 90;
export const ECARD_LOCATION_LONGITUDE_MIN = -180;
export const ECARD_LOCATION_LONGITUDE_MAX = 180;

export const ECARD_REVIEW_LINK_URL_MAX_LENGTH = 2048;

// A hand-typed list (unlike Team's org-member picker), so kept smaller than
// ECARD_MAX_TEAM_MEMBERS.
export const ECARD_MAX_TESTIMONIALS = 20;
export const ECARD_TESTIMONIAL_NAME_MAX_LENGTH = 100;
export const ECARD_TESTIMONIAL_TEXT_MAX_LENGTH = 500;
export const ECARD_TESTIMONIAL_RATING_MIN = 1;
export const ECARD_TESTIMONIAL_RATING_MAX = 5;

// Shared by Gallery image captions and Video Gallery video captions.
export const ECARD_CAPTION_MAX_LENGTH = 100;

export const ECARD_VIDEO_URL_MAX_LENGTH = 2048;

export const ECARD_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const ECARD_IMAGE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN = /^image\/(jpeg|png|webp)$/;

export const ECARD_BROCHURE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const ECARD_BROCHURE_ALLOWED_EXTENSIONS = ['pdf'];
export const ECARD_BROCHURE_ALLOWED_MIME_TYPE_PATTERN = /^application\/pdf$/;

export const ECARD_MULTIPART_DATA_FIELD = 'data';
export const ECARD_HERO_PHOTO_FIELD = 'heroProfilePhoto';
export const ECARD_HERO_BANNER_FIELD = 'heroBanner';
export const ECARD_GALLERY_IMAGE_FIELD_PREFIX = 'galleryImage_';
export const ECARD_BROCHURE_FIELD = 'brochurePdf';

// The only ECardHeroLayout values a plan can ever restrict — DEFAULT is
// hard-coded as always-available in PlanPolicyResolverService and never
// given a row in EcardHeroLayoutAvailability. Single source of truth for the
// admin toggle-grid UI, the policy DTO's completeness check, and the
// resolver's default-false seeding.
export const ECARD_GATED_HERO_LAYOUTS = [
  ECardHeroLayout.BANNER,
  ECardHeroLayout.BANNER_PROFILE,
  ECardHeroLayout.ORG_BADGE,
] as const;

export type GatedHeroLayout = (typeof ECARD_GATED_HERO_LAYOUTS)[number];

export function isGatedHeroLayout(
  layout: ECardHeroLayout,
): layout is GatedHeroLayout {
  return (ECARD_GATED_HERO_LAYOUTS as readonly ECardHeroLayout[]).includes(
    layout,
  );
}

// The only ECardTheme values a plan can ever restrict — DEFAULT_DARK is
// hard-coded as always-available in PlanPolicyResolverService and never
// given a row in EcardThemeAvailability. Single source of truth for the
// admin toggle-grid UI, the policy DTO's completeness check, and the
// resolver's default-false seeding — mirrors ECARD_GATED_HERO_LAYOUTS.
export const ECARD_GATED_THEMES = [
  ECardTheme.LIGHT,
  ECardTheme.NAVY_TEAL,
] as const;

export type GatedTheme = (typeof ECARD_GATED_THEMES)[number];

export function isGatedTheme(theme: ECardTheme): theme is GatedTheme {
  return (ECARD_GATED_THEMES as readonly ECardTheme[]).includes(theme);
}

// The only ECardIconShape values a plan can ever restrict — CIRCLE is
// hard-coded as always-available, never given a row in
// EcardIconShapeAvailability. Same convention as ECARD_GATED_THEMES above.
export const ECARD_GATED_ICON_SHAPES = [
  ECardIconShape.SQUIRCLE,
  ECardIconShape.ROUNDED_SQUARE,
  ECardIconShape.TEARDROP,
] as const;

export type GatedIconShape = (typeof ECARD_GATED_ICON_SHAPES)[number];

export function isGatedIconShape(
  shape: ECardIconShape,
): shape is GatedIconShape {
  return (ECARD_GATED_ICON_SHAPES as readonly ECardIconShape[]).includes(shape);
}

// A sanity guardrail on the admin-authored preset list per plan, not a
// product-mandated limit.
export const ECARD_MAX_ACCENT_COLOR_PRESETS = 20;

// Seeded onto every pre-existing EcardPolicy row by
// prisma/scripts/seed-ecard-accent-color-preset-defaults.ts (this feature
// is a retrofit — every plan currently has zero presets), and used as the
// starting draft for any new plan created in the admin panel going forward.
// Editable/removable per plan afterwards — not hardcoded once seeded.
export const DEFAULT_ECARD_ACCENT_COLOR_PRESETS: {
  themeAffinity: ECardAccentColorPresetThemeAffinity;
  primaryColor: string;
  secondaryColor: string;
}[] = [
  { themeAffinity: 'DARK', primaryColor: '#38bdf8', secondaryColor: '#818cf8' },
  { themeAffinity: 'DARK', primaryColor: '#34d399', secondaryColor: '#2dd4bf' },
  { themeAffinity: 'DARK', primaryColor: '#fbbf24', secondaryColor: '#fb923c' },
  { themeAffinity: 'DARK', primaryColor: '#fb7185', secondaryColor: '#f472b6' },
  {
    themeAffinity: 'LIGHT',
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
  },
  {
    themeAffinity: 'LIGHT',
    primaryColor: '#059669',
    secondaryColor: '#0d9488',
  },
  {
    themeAffinity: 'LIGHT',
    primaryColor: '#d97706',
    secondaryColor: '#ea580c',
  },
  {
    themeAffinity: 'LIGHT',
    primaryColor: '#e11d48',
    secondaryColor: '#db2777',
  },
];

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
