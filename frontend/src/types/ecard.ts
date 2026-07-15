export interface EcardHero {
  name: string;
  email: string;
  companyName: string | null;
  profilePhotoMediaId: string | null;
  profilePhotoUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
  isExchangeContactEnabled: boolean;
}

interface EcardComponentBase {
  id: string;
  order: number;
}

export interface EcardAboutComponent extends EcardComponentBase {
  type: "ABOUT";
  profession: string | null;
  shortNote: string | null;
  description: string | null;
  aboutMe: string | null;
}

export interface EcardSocialLinksComponent extends EcardComponentBase {
  type: "SOCIAL_LINKS";
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedIn: string | null;
}

export interface EcardVideoComponent extends EcardComponentBase {
  type: "VIDEO";
  title: string | null;
  videoUrl: string | null;
}

export interface EcardGalleryImage {
  imageMediaId: string;
  imageUrl: string;
}

export interface EcardSubGallery {
  id: string;
  title: string | null;
  images: EcardGalleryImage[];
}

export interface EcardGalleryComponent extends EcardComponentBase {
  type: "GALLERY";
  subGalleries: EcardSubGallery[];
}

export interface EcardTeamMember {
  organisationMemberId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
  ecardEndpoint: string | null;
}

export interface EcardTeamComponent extends EcardComponentBase {
  type: "TEAM";
  title: string | null;
  members: EcardTeamMember[];
}

export interface EcardWhatsAppComponent extends EcardComponentBase {
  type: "WHATSAPP";
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

export interface EcardBrochureComponent extends EcardComponentBase {
  type: "BROCHURE";
  pdfMediaId: string | null;
  pdfUrl: string | null;
  fileName: string | null;
}

export type EcardComponent =
  | EcardAboutComponent
  | EcardSocialLinksComponent
  | EcardVideoComponent
  | EcardGalleryComponent
  | EcardTeamComponent
  | EcardWhatsAppComponent
  | EcardBrochureComponent;

export type EcardComponentType = EcardComponent["type"];

export interface Ecard {
  id: string;
  endpoint: string;
  customerId: string;
  organisationId: string | null;
  createdByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  hero: EcardHero;
  components: EcardComponent[];
}

/** Wire shape of `GET /api/public/ecards/:endpoint` — the view event id lets
 * the public page report back how long the visit lasted (see
 * useEcardViewDurationTracker). */
export interface GetPublicEcardResponse {
  card: Ecard;
  viewEventId: string;
}

export interface EcardListResponse {
  ecards: Ecard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListEcardsQuery {
  customerId?: string;
  page: number;
  pageSize: number;
}

export interface OrganisationMemberLinkedEcard {
  id: string;
  endpoint: string;
  heroName: string;
}

export interface OrganisationMemberSummary {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: "SPOC" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED";
  joinedAt: string;
  linkedEcard: OrganisationMemberLinkedEcard | null;
}

/** Mirrors the backend's discriminated image-slot DTO — 'upload' expects a
 * same-request file under the slot's positional field name, 'keep' points
 * back at an already-uploaded Media id. */
export type ImageSlotPayload =
  | { action: "upload" }
  | { action: "keep"; mediaId: string };

export interface EcardAboutComponentPayload {
  type: "ABOUT";
  profession?: string;
  shortNote?: string;
  description?: string;
  aboutMe?: string;
}

export interface EcardSocialLinksComponentPayload {
  type: "SOCIAL_LINKS";
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedIn?: string;
}

export interface EcardVideoComponentPayload {
  type: "VIDEO";
  title?: string;
  videoUrl: string;
}

export interface EcardSubGalleryPayload {
  title?: string;
  images: ImageSlotPayload[];
}

export interface EcardGalleryComponentPayload {
  type: "GALLERY";
  subGalleries: EcardSubGalleryPayload[];
}

export interface EcardTeamComponentPayload {
  type: "TEAM";
  title?: string;
  members: { organisationMemberId: string }[];
}

export interface EcardWhatsAppComponentPayload {
  type: "WHATSAPP";
  phoneCountryDialCode: string;
  phoneNumber: string;
}

export interface EcardBrochureComponentPayload {
  type: "BROCHURE";
  pdf: ImageSlotPayload;
}

export type EcardComponentPayload =
  | EcardAboutComponentPayload
  | EcardSocialLinksComponentPayload
  | EcardVideoComponentPayload
  | EcardGalleryComponentPayload
  | EcardTeamComponentPayload
  | EcardWhatsAppComponentPayload
  | EcardBrochureComponentPayload;

export interface EcardPayload {
  endpoint: string;
  heroName: string;
  heroEmail: string;
  heroCompanyName?: string;
  /** Which organisation this card belongs to — no admin UI sets this yet
   * (org-template feature is future work), kept optional for forward compat
   * with the backend DTO. */
  organisationId?: string;
  phoneCountryDialCode?: string;
  phoneNumber?: string;
  isExchangeContactEnabled: boolean;
  heroProfilePhoto?: ImageSlotPayload;
  components: EcardComponentPayload[];
}

export interface CreateEcardAsEmployeePayload extends EcardPayload {
  customerId: string;
}

export type UpdateEcardPayload = EcardPayload;

/** One entry per `upload` image slot in a payload, keyed by its positional field name. */
export interface EcardImageUpload {
  fieldName: string;
  file: File;
}
