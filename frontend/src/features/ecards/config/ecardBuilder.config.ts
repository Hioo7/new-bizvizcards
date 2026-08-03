import {
  BookOpen,
  Clapperboard,
  FileText,
  Images,
  Link2,
  MessageCircle,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  EcardComponentType,
} from "@app-types/ecard";

export const ECARD_COMPONENT_TYPES: EcardComponentType[] = [
  "ABOUT",
  "SOCIAL_LINKS",
  "GALLERY",
  "VIDEO",
  "VIDEO_GALLERY",
  "TEAM",
  "WHATSAPP",
  "BROCHURE",
];

export const ECARD_MAX_COMPONENTS = ECARD_COMPONENT_TYPES.length;

interface EcardComponentMeta {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const ECARD_COMPONENT_META: Record<EcardComponentType, EcardComponentMeta> = {
  ABOUT: {
    label: "About / Bio",
    icon: FileText,
    description: "A short bio and about-me text.",
  },
  SOCIAL_LINKS: {
    label: "Social Links",
    icon: Link2,
    description: "Website and social profiles.",
  },
  GALLERY: {
    label: "Gallery",
    icon: Images,
    description: "Themed photo galleries.",
  },
  VIDEO: {
    label: "Video",
    icon: Video,
    description: "An embedded YouTube or Vimeo video.",
  },
  VIDEO_GALLERY: {
    label: "Video Gallery",
    icon: Clapperboard,
    description: "Themed YouTube or Vimeo video galleries.",
  },
  TEAM: {
    label: "Team",
    icon: Users,
    description: "Team members from your organisation.",
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: MessageCircle,
    description: "A \"Connect on WhatsApp\" card linking to a chat.",
  },
  BROCHURE: {
    label: "Brochure",
    icon: BookOpen,
    description: "A button linking to an uploaded PDF brochure.",
  },
};

export const ECARD_TEXT_SHORT_MAX_LENGTH = 150;
export const ECARD_TEXT_MEDIUM_MAX_LENGTH = 500;
export const ECARD_TEXT_LONG_MAX_LENGTH = 5000;

export const ECARD_MAX_SUB_GALLERIES = 10;
export const ECARD_MAX_GALLERY_IMAGES = 30;
export const ECARD_MAX_VIDEO_SUB_GALLERIES = 10;
export const ECARD_MAX_VIDEOS_PER_GALLERY = 30;
export const ECARD_CAPTION_MAX_LENGTH = 100;
export const ECARD_MAX_TEAM_MEMBERS = 50;

export const ECARD_ENDPOINT_MIN_LENGTH = 3;
export const ECARD_ENDPOINT_MAX_LENGTH = 80;
// Case-insensitive: pre-existing e-card endpoints from a dry-run migration
// contain uppercase characters — kept in sync with the backend's
// URL_SLUG_REGEX so editing those legacy cards doesn't get blocked here.
export const ECARD_ENDPOINT_REGEX = /^[a-zA-Z0-9-]+$/;

export const ECARD_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const ECARD_PHONE_NUMBER_MIN_DIGITS = 7;
export const ECARD_PHONE_NUMBER_MAX_DIGITS = 15;
export const ECARD_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

export const ECARD_BROCHURE_ALLOWED_MIME_TYPES = ["application/pdf"];
export const ECARD_BROCHURE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

// Shown when the outer "Save card" action is blocked by a client-side pre-check of the
// Hero section (e.g. the endpoint was never set) — see getHeroValidationErrors.
export const ECARD_HERO_FIELDS_INCOMPLETE_MESSAGE =
  "Please complete the required Hero fields.";

export const ECARD_HERO_LAYOUTS: ECardHeroLayout[] = [
  "DEFAULT",
  "BANNER",
  "BANNER_PROFILE",
  "ORG_BADGE",
];

interface EcardHeroLayoutMeta {
  label: string;
  description: string;
}

export const ECARD_HERO_LAYOUT_META: Record<ECardHeroLayout, EcardHeroLayoutMeta> = {
  DEFAULT: {
    label: "Default",
    description: "Profile photo with name and company.",
  },
  BANNER: {
    label: "Banner",
    description: "A wide banner image up top, details below.",
  },
  BANNER_PROFILE: {
    label: "Banner + Profile",
    description: "Banner image with the profile photo overlapping it.",
  },
  ORG_BADGE: {
    label: "Org Badge",
    description: "Default layout plus your organisation's logo badge.",
  },
};

export const ECARD_HERO_BANNER_ASPECT = 21 / 9;
// Tailwind's JIT scanner needs a literal class string in source (a computed
// template string won't be picked up) — kept in sync with the ratio above.
export const ECARD_HERO_BANNER_ASPECT_CLASS = "aspect-[21/9]";

export const ECARD_HERO_DEFAULT_FALLBACK_COLOR = "#e5e7eb";

export const ECARD_HERO_THEMES: ECardTheme[] = [
  "DEFAULT_DARK",
  "LIGHT",
  "NAVY_TEAL",
];

interface EcardThemeMeta {
  label: string;
  description: string;
  /** The exact gradient stops used by the public renderer's page background
   * (see EcardRenderer.tsx) — reused here so the picker's preview swatch is
   * a real, accurate miniature of the actual theme, not an approximation. */
  gradient: { from: string; via: string; to: string };
  accent: string;
}

export const ECARD_HERO_THEME_META: Record<ECardTheme, EcardThemeMeta> = {
  DEFAULT_DARK: {
    label: "Dark",
    description: "The classic near-black gradient with a sky-blue accent.",
    gradient: { from: "#000000", via: "#171717", to: "#000000" },
    accent: "#7dd3fc",
  },
  LIGHT: {
    label: "Light",
    description: "A clean white theme with a bold blue accent.",
    gradient: { from: "#ffffff", via: "#e4e4e7", to: "#ffffff" },
    accent: "#2563eb",
  },
  NAVY_TEAL: {
    label: "Navy Teal",
    description: "A deep navy-teal gradient with a bright teal accent.",
    gradient: { from: "#050b0d", via: "#0e2a2e", to: "#050b0d" },
    accent: "#2dd4bf",
  },
};

export const ECARD_HERO_ICON_SHAPES: ECardIconShape[] = [
  "CIRCLE",
  "SQUIRCLE",
  "ROUNDED_SQUARE",
  "TEARDROP",
];

interface EcardIconShapeMeta {
  label: string;
  /** Tailwind classes for the shape LAYER only (background + border-radius,
   * optionally a rotation) — shared verbatim between the picker's preview
   * swatches and the public e-card's actual SOCIAL_LINKS icon containers.
   * Applied to a dedicated absolutely-positioned layer, never to the icon
   * glyph itself or its centering wrapper, since TEARDROP's rotation would
   * otherwise turn the glyph sideways too. */
  className: string;
}

export const ECARD_HERO_ICON_SHAPE_META: Record<
  ECardIconShape,
  EcardIconShapeMeta
> = {
  CIRCLE: { label: "Circle", className: "rounded-full" },
  // Deliberately mid-way between ROUNDED_SQUARE's fixed radius and a full
  // circle — a visibly-square silhouette with heavily softened corners, not
  // "almost a circle" (45%+ reads as circle at these sizes) and not a plain
  // rounded rect (30%- still shows a flat edge seam).
  SQUIRCLE: { label: "Squircle", className: "rounded-[38%]" },
  ROUNDED_SQUARE: { label: "Rounded square", className: "rounded-xl" },
  // Android's own adaptive-icon "teardrop" mask: mostly circular, with ONE
  // corner noticeably less rounded than the other three — a gentle
  // asymmetry, not a sharp 45°-rotated point (that's a map-pin, not this).
  TEARDROP: {
    label: "Teardrop",
    className: "rounded-[50%_50%_50%_15%]",
  },
};
