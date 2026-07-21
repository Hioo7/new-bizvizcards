import type {
  EcardAboutComponentPayload,
  EcardComponent,
  EcardGalleryComponentPayload,
  EcardImageUpload,
  EcardSocialLinksComponentPayload,
  EcardTeamComponentPayload,
  ImageSlotPayload,
} from "@app-types/ecard";

export interface OrganisationEcardTemplateHero {
  name: string | null;
  email: string | null;
  companyName: string | null;
  profilePhotoMediaId: string | null;
  profilePhotoUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

/** The response's `components` are the exact same shape as an e-card's own
 * (already fully nullable per field) — reused directly, no new type needed. */
export interface OrganisationEcardTemplate {
  id: string;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  hero: OrganisationEcardTemplateHero;
  components: EcardComponent[];
}

// Payload variants for the three component types whose e-card payload
// requires fields the template must allow leaving unset (WhatsApp's phone
// pair, Video's url, Brochure's pdf) — every other component type's payload
// is already fully optional and reused as-is from @app-types/ecard.
export interface OrganisationEcardTemplateVideoComponentPayload {
  type: "VIDEO";
  title?: string;
  videoUrl?: string;
}

export interface OrganisationEcardTemplateWhatsAppComponentPayload {
  type: "WHATSAPP";
  phoneCountryDialCode?: string;
  phoneNumber?: string;
}

export interface OrganisationEcardTemplateBrochureComponentPayload {
  type: "BROCHURE";
  pdf?: ImageSlotPayload;
}

export type OrganisationEcardTemplateComponentPayload =
  | EcardAboutComponentPayload
  | EcardSocialLinksComponentPayload
  | EcardGalleryComponentPayload
  | OrganisationEcardTemplateVideoComponentPayload
  | EcardTeamComponentPayload
  | OrganisationEcardTemplateWhatsAppComponentPayload
  | OrganisationEcardTemplateBrochureComponentPayload;

export interface OrganisationEcardTemplatePayload {
  heroName?: string;
  heroEmail?: string;
  heroCompanyName?: string;
  phoneCountryDialCode?: string;
  phoneNumber?: string;
  heroProfilePhoto?: ImageSlotPayload;
  components: OrganisationEcardTemplateComponentPayload[];
}

export type OrganisationEcardTemplateImageUpload = EcardImageUpload;
