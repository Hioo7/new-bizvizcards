import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";
import type { ECardHeroLayout, ECardIconShape, ECardTheme } from "@app-types/ecard";
import { ECARD_HERO_DEFAULT_FALLBACK_COLOR } from "@features/ecards/config/ecardBuilder.config";

export interface EcardHeroDraft {
  name: string;
  email: string;
  companyName: string;
  photo: ImageFieldValue;
  phoneCountryDialCode: string;
  phoneNumber: string;
  isExchangeContactEnabled: boolean;
  autoDownloadContact: boolean;
  endpoint: string;
  organisationId: string | null;
  organisationLogoUrl: string | null;
  layout: ECardHeroLayout;
  banner: ImageFieldValue;
  bannerFallbackColor: string;
  badgeFallbackColor: string;
  theme: ECardTheme;
  // null = inherit from the active theme's own accent tokens.
  primaryAccentColor: string | null;
  secondaryAccentColor: string | null;
  iconShape: ECardIconShape;
}

export function emptyHeroDraft(): EcardHeroDraft {
  return {
    name: "",
    email: "",
    companyName: "",
    photo: emptyImageField(),
    phoneCountryDialCode: "",
    phoneNumber: "",
    isExchangeContactEnabled: true,
    autoDownloadContact: false,
    endpoint: "",
    organisationId: null,
    organisationLogoUrl: null,
    layout: "DEFAULT",
    banner: emptyImageField(),
    bannerFallbackColor: ECARD_HERO_DEFAULT_FALLBACK_COLOR,
    badgeFallbackColor: ECARD_HERO_DEFAULT_FALLBACK_COLOR,
    theme: "DEFAULT_DARK",
    primaryAccentColor: null,
    secondaryAccentColor: null,
    iconShape: "CIRCLE",
  };
}

export interface AboutComponentDraft {
  type: "ABOUT";
  profession: string;
  shortNote: string;
  description: string;
  aboutMe: string;
}

export interface SocialLinksComponentDraft {
  type: "SOCIAL_LINKS";
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;
  linkedIn: string;
  youtube: string;
}

export interface VideoComponentDraft {
  type: "VIDEO";
  title: string;
  videoUrl: string;
}

export interface GalleryImageEntryDraft {
  image: ImageFieldValue;
  caption: string;
}

export interface GallerySubGalleryDraft {
  title: string;
  images: GalleryImageEntryDraft[];
}

export interface GalleryComponentDraft {
  type: "GALLERY";
  subGalleries: GallerySubGalleryDraft[];
}

export interface VideoGalleryVideoDraft {
  videoUrl: string;
  caption: string;
}

export interface VideoGallerySubGalleryDraft {
  title: string;
  videos: VideoGalleryVideoDraft[];
}

export interface VideoGalleryComponentDraft {
  type: "VIDEO_GALLERY";
  subGalleries: VideoGallerySubGalleryDraft[];
}

export interface TeamComponentDraft {
  type: "TEAM";
  title: string;
  memberIds: string[];
}

export interface WhatsAppComponentDraft {
  type: "WHATSAPP";
  phoneCountryDialCode: string;
  phoneNumber: string;
}

export interface BrochureComponentDraft {
  type: "BROCHURE";
  pdf: ImageFieldValue;
}

export interface LocationTileComponentDraft {
  type: "LOCATION_TILE";
  label: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ReviewLinkComponentDraft {
  type: "REVIEW_LINK";
  url: string;
}

export interface TestimonialEntryDraft {
  name: string;
  rating: number;
  text: string;
}

export interface TestimonialsComponentDraft {
  type: "TESTIMONIALS";
  entries: TestimonialEntryDraft[];
}

export type ComponentDraft =
  | AboutComponentDraft
  | SocialLinksComponentDraft
  | VideoComponentDraft
  | GalleryComponentDraft
  | VideoGalleryComponentDraft
  | TeamComponentDraft
  | WhatsAppComponentDraft
  | BrochureComponentDraft
  | LocationTileComponentDraft
  | ReviewLinkComponentDraft
  | TestimonialsComponentDraft;

export function emptyDraftForType(type: ComponentDraft["type"]): ComponentDraft {
  switch (type) {
    case "ABOUT":
      return { type: "ABOUT", profession: "", shortNote: "", description: "", aboutMe: "" };
    case "SOCIAL_LINKS":
      return {
        type: "SOCIAL_LINKS",
        website: "",
        instagram: "",
        facebook: "",
        twitter: "",
        linkedIn: "",
        youtube: "",
      };
    case "VIDEO":
      return { type: "VIDEO", title: "", videoUrl: "" };
    case "GALLERY":
      return { type: "GALLERY", subGalleries: [] };
    case "VIDEO_GALLERY":
      return { type: "VIDEO_GALLERY", subGalleries: [] };
    case "TEAM":
      return { type: "TEAM", title: "", memberIds: [] };
    case "WHATSAPP":
      return { type: "WHATSAPP", phoneCountryDialCode: "", phoneNumber: "" };
    case "BROCHURE":
      return { type: "BROCHURE", pdf: emptyImageField() };
    case "LOCATION_TILE":
      return { type: "LOCATION_TILE", label: "", latitude: null, longitude: null };
    case "REVIEW_LINK":
      return { type: "REVIEW_LINK", url: "" };
    case "TESTIMONIALS":
      return { type: "TESTIMONIALS", entries: [] };
  }
}

/** `key` is a stable local id for dnd-kit + React list keys — independent of
 * the server-assigned component id, which doesn't exist yet for freshly
 * added components. */
export interface BuilderComponent {
  key: string;
  draft: ComponentDraft;
}

export interface EcardBuilderState {
  hero: EcardHeroDraft;
  components: BuilderComponent[];
}

export function emptyEcardBuilderState(): EcardBuilderState {
  return { hero: emptyHeroDraft(), components: [] };
}
