import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";

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
}

export interface VideoComponentDraft {
  type: "VIDEO";
  title: string;
  videoUrl: string;
}

export interface GallerySubGalleryDraft {
  title: string;
  images: ImageFieldValue[];
}

export interface GalleryComponentDraft {
  type: "GALLERY";
  subGalleries: GallerySubGalleryDraft[];
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

export type ComponentDraft =
  | AboutComponentDraft
  | SocialLinksComponentDraft
  | VideoComponentDraft
  | GalleryComponentDraft
  | TeamComponentDraft
  | WhatsAppComponentDraft
  | BrochureComponentDraft;

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
      };
    case "VIDEO":
      return { type: "VIDEO", title: "", videoUrl: "" };
    case "GALLERY":
      return { type: "GALLERY", subGalleries: [] };
    case "TEAM":
      return { type: "TEAM", title: "", memberIds: [] };
    case "WHATSAPP":
      return { type: "WHATSAPP", phoneCountryDialCode: "", phoneNumber: "" };
    case "BROCHURE":
      return { type: "BROCHURE", pdf: emptyImageField() };
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
