export type SmartCardTemplateKey =
  | "INTERIOR_DESIGN_TEMPLATE"
  | "INTERIOR_DESIGN_TEMPLATE_2";

export type ImageSlot =
  | { action: "upload" }
  | { action: "keep"; mediaId: string };

export interface SmartCardContact {
  contactNumber?: string;
  email?: string;
  address?: string;
}

export interface SmartCardSocialMedia {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedIn?: string;
  twitter?: string;
  youtube?: string;
  googleMap?: string;
  website?: string;
  other?: string;
}

export interface SmartCardTestimonial {
  name?: string;
  initials?: string;
  text?: string;
}

// ── Read shapes (assembled response) ────────────────────────────────────────

export interface SmartCardProfile {
  companyName: string | null;
  tagline: string | null;
  subTagline: string | null;
  aboutText: string | null;
  logoMediaId: string | null;
  logoUrl: string | null;
}

export interface SmartCardFounder {
  name: string | null;
  title: string | null;
  experience: number | null;
  projects: number | null;
  satisfaction: number | null;
  introText: string | null;
  philosophyText: string | null;
  quote: string | null;
  imageMediaId: string | null;
  imageUrl: string | null;
}

export interface SmartCardServiceItem {
  title: string | null;
  description: string | null;
  imageMediaId: string | null;
  imageUrl: string | null;
}

export interface SmartCardGalleryImage {
  imageMediaId: string;
  imageUrl: string;
}

export interface SmartCardGallery {
  title: string | null;
  images: SmartCardGalleryImage[];
}

export interface SmartCard {
  id: string;
  endpoint: string;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
  profile: SmartCardProfile | null;
  contact: SmartCardContact | null;
  socialMedia: SmartCardSocialMedia | null;
  founder: SmartCardFounder | null;
  services: SmartCardServiceItem[];
  testimonials: SmartCardTestimonial[];
  galleries: SmartCardGallery[];
}

export interface PublicSmartCard extends SmartCard {
  templateKey: SmartCardTemplateKey;
}

export interface SmartCardListResponse {
  smartCards: SmartCard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListSmartCardsQuery {
  customerId?: string;
  page: number;
  pageSize: number;
}

// ── Write shapes (create/update payload) ────────────────────────────────────

export interface SmartCardProfileInput {
  companyName?: string;
  tagline?: string;
  subTagline?: string;
  aboutText?: string;
  logo?: ImageSlot;
}

export interface SmartCardFounderInput {
  name?: string;
  title?: string;
  experience?: number;
  projects?: number;
  satisfaction?: number;
  introText?: string;
  philosophyText?: string;
  quote?: string;
  image?: ImageSlot;
}

export interface SmartCardServiceInput {
  title?: string;
  description?: string;
  image?: ImageSlot;
}

export interface SmartCardGalleryInput {
  title?: string;
  images: ImageSlot[];
}

export interface SmartCardPayload {
  endpoint?: string;
  customerId?: string | null;
  profile?: SmartCardProfileInput;
  contact?: SmartCardContact;
  socialMedia?: SmartCardSocialMedia;
  founder?: SmartCardFounderInput;
  services?: SmartCardServiceInput[];
  testimonials?: SmartCardTestimonial[];
  galleries?: SmartCardGalleryInput[];
}

export interface CreateSmartCardPayload extends SmartCardPayload {
  endpoint: string;
}

export type UpdateSmartCardPayload = SmartCardPayload;

/** One entry per `upload` image slot in a payload, keyed by its positional field name. */
export interface SmartCardImageUpload {
  fieldName: string;
  file: File;
}
