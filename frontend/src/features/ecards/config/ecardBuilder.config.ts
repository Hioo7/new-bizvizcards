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
import type { EcardComponentType } from "@app-types/ecard";

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
export const ECARD_ENDPOINT_REGEX = /^[a-z0-9-]+$/;

export const ECARD_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const ECARD_PHONE_NUMBER_MIN_DIGITS = 7;
export const ECARD_PHONE_NUMBER_MAX_DIGITS = 15;
export const ECARD_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

export const ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN =
  /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;

export const ECARD_BROCHURE_ALLOWED_MIME_TYPES = ["application/pdf"];
export const ECARD_BROCHURE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
