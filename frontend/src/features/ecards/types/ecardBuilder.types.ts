import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";

export interface EcardHeroDraft {
  companyName: string;
  photo: ImageFieldValue;
  phoneCountryDialCode: string;
  phoneNumber: string;
  isExchangeContactEnabled: boolean;
  endpoint: string;
}

export function emptyHeroDraft(): EcardHeroDraft {
  return {
    companyName: "",
    photo: emptyImageField(),
    phoneCountryDialCode: "",
    phoneNumber: "",
    isExchangeContactEnabled: true,
    endpoint: "",
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

export type ComponentDraft =
  | AboutComponentDraft
  | SocialLinksComponentDraft
  | VideoComponentDraft
  | GalleryComponentDraft
  | TeamComponentDraft
  | WhatsAppComponentDraft;

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
