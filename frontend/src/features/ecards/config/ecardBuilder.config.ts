import {
  BookOpen,
  FileText,
  Images,
  Link2,
  MessageCircle,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ECardHeroLayout, EcardComponentType } from "@app-types/ecard";

export const ECARD_COMPONENT_TYPES: EcardComponentType[] = [
  "ABOUT",
  "SOCIAL_LINKS",
  "GALLERY",
  "VIDEO",
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
