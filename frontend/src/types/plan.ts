import type {
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  EcardComponentType,
} from "./ecard";
import type { SmartCardTemplateKey } from "./smartCard";

// Only the plan-restrictable layouts — DEFAULT is never included here, it's
// hard-coded as always-available on the backend.
export type GatedHeroLayout = Exclude<ECardHeroLayout, "DEFAULT">;

export interface EcardHeroLayoutAvailability {
  layout: GatedHeroLayout;
  isAvailable: boolean;
}

// Same convention — DEFAULT_DARK/CIRCLE are never included, they're
// hard-coded as always-available on the backend.
export type GatedTheme = Exclude<ECardTheme, "DEFAULT_DARK">;
export type GatedIconShape = Exclude<ECardIconShape, "CIRCLE">;

export interface EcardThemeAvailability {
  theme: GatedTheme;
  isAvailable: boolean;
}

export interface EcardIconShapeAvailability {
  iconShape: GatedIconShape;
  isAvailable: boolean;
}

export type AccentColorPresetThemeAffinity = "DARK" | "LIGHT";

export interface EcardAccentColorPreset {
  themeAffinity: AccentColorPresetThemeAffinity;
  primaryColor: string;
  secondaryColor: string;
}

export type PlanBusinessModelType = "ONE_TIME" | "SUBSCRIPTION" | "TRIAL";

export interface GalleryComponentLimits {
  maxGalleries: number;
  maxImagesPerGallery: number;
  maxGallerySizeBytes: number;
}

// Same shape as GalleryComponentLimits, minus a file-size dimension — video
// gallery entries are URLs, not uploads.
export interface VideoGalleryComponentLimits {
  maxVideoGalleries: number;
  maxVideosPerGallery: number;
}

export interface EcardComponentAvailability {
  type: EcardComponentType;
  isAvailable: boolean;
  // Required iff type === "GALLERY", omitted for every other component type.
  galleryLimits?: GalleryComponentLimits;
  // Required iff type === "VIDEO_GALLERY", omitted for every other type.
  videoGalleryLimits?: VideoGalleryComponentLimits;
}

export interface EcardPolicy {
  isAvailable: boolean;
  maxEcards: number;
  exchangeContactAccess: boolean;
  // Gates the customizable exchange-contact form feature — OR-boosted via
  // an organisation's orgEcardPolicy same as exchangeContactAccess above.
  isCustomFormAvailable: boolean;
  // Personal-only cap, never org-boosted — same treatment as maxEcards.
  maxCustomForms: number;
  // Full free-hex custom accent-color entry — independent of
  // accentColorPresets below, which don't require this to be true.
  accentColorCustomizationAvailable: boolean;
  componentAvailabilities: EcardComponentAvailability[];
  heroLayoutAvailabilities: EcardHeroLayoutAvailability[];
  themeAvailabilities: EcardThemeAvailability[];
  iconShapeAvailabilities: EcardIconShapeAvailability[];
  accentColorPresets: EcardAccentColorPreset[];
}

export interface SmartCardPolicy {
  isAvailable: boolean;
  maxSmartCards: number;
  exchangeContactAccess: boolean;
  // Empty array means no templates are permitted (strict allowlist), not
  // "no restriction".
  whitelistedTemplateIds: string[];
}

export interface OrganisationPolicy {
  isAvailable: boolean;
  maxOrgsCanJoin: number;
  maxOrgsCanCreate: number;
  orgEcardPolicy: EcardPolicy;
  orgSmartCardPolicy: SmartCardPolicy;
}

export interface EventPolicy {
  isAvailable: boolean;
  maxEvents: number;
  maxGuestsPerEvent: number;
}

export interface EmailSignaturePolicy {
  isAvailable: boolean;
  maxEmailSignatures: number;
}

export type VirtualBackgroundQrCorner =
  | "TOP_LEFT"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_RIGHT";

export interface VirtualBackgroundPolicy {
  isAvailable: boolean;
  maxVirtualBackgrounds: number;
  allowCustomBackground: boolean;
  // Empty array means no shared-library templates are offered (strict
  // allowlist), not "no restriction".
  whitelistedTemplateIds: string[];
}

export interface PlanSummary {
  id: string;
  name: string;
  price: number;
  businessModelType: PlanBusinessModelType;
  subscriptionDurationMonths: number | null;
  isPublic: boolean;
  isFallbackPlan: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDetail extends PlanSummary {
  ecardPolicy: EcardPolicy;
  smartCardPolicy: SmartCardPolicy;
  organisationPolicy: OrganisationPolicy;
  eventPolicy: EventPolicy;
  emailSignaturePolicy: EmailSignaturePolicy;
  virtualBackgroundPolicy: VirtualBackgroundPolicy;
}

export interface PlanListResponse {
  plans: PlanSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPlansQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface PlanPolicyPayload {
  ecardPolicy: EcardPolicy;
  smartCardPolicy: SmartCardPolicy;
  organisationPolicy: OrganisationPolicy;
  eventPolicy: EventPolicy;
  emailSignaturePolicy: EmailSignaturePolicy;
  virtualBackgroundPolicy: VirtualBackgroundPolicy;
}

export interface CreatePlanPayload extends PlanPolicyPayload {
  name: string;
  price: number;
  businessModelType: PlanBusinessModelType;
  subscriptionDurationMonths?: number;
  isPublic: boolean;
}

export interface UpdatePlanPayload extends Partial<PlanPolicyPayload> {
  name?: string;
  price?: number;
  businessModelType?: PlanBusinessModelType;
  subscriptionDurationMonths?: number;
  isPublic?: boolean;
}

export interface EffectiveEcardPolicy {
  isAvailable: boolean;
  maxEcards: number;
  exchangeContactAccess: boolean;
  // Gates the customizable exchange-contact form feature — already
  // OR-boosted with any linked organisation's boost server-side.
  isCustomFormAvailable: boolean;
  // Personal-only cap, never org-boosted — same treatment as maxEcards.
  maxCustomForms: number;
  components: Record<EcardComponentType, boolean>;
  galleryLimits: GalleryComponentLimits;
  videoGalleryLimits: VideoGalleryComponentLimits;
  heroLayouts: Record<ECardHeroLayout, boolean>;
  // Same convention — DEFAULT_DARK/CIRCLE are unconditionally true.
  themes: Record<ECardTheme, boolean>;
  iconShapes: Record<ECardIconShape, boolean>;
  accentColorCustomizationAvailable: boolean;
  accentColorPresets: EcardAccentColorPreset[];
}

export interface EffectiveSmartCardPolicy {
  isAvailable: boolean;
  maxSmartCards: number;
  exchangeContactAccess: boolean;
  whitelistedTemplateKeys: SmartCardTemplateKey[];
}

export interface EffectiveOrganisationPolicy {
  isAvailable: boolean;
  maxOrgsCanJoin: number;
  maxOrgsCanCreate: number;
  orgEcardPolicy: EffectiveEcardPolicy;
  orgSmartCardPolicy: EffectiveSmartCardPolicy;
}

export interface EffectiveEventPolicy {
  isAvailable: boolean;
  maxEvents: number;
  maxGuestsPerEvent: number;
}

export interface EffectiveEmailSignaturePolicy {
  isAvailable: boolean;
  maxEmailSignatures: number;
}

export interface EffectiveVirtualBackgroundTemplate {
  id: string;
  name: string;
}

export interface EffectiveVirtualBackgroundPolicy {
  isAvailable: boolean;
  maxVirtualBackgrounds: number;
  allowCustomBackground: boolean;
  availableTemplates: EffectiveVirtualBackgroundTemplate[];
}

export interface EffectivePolicy {
  planId: string;
  isFallback: boolean;
  ecard: EffectiveEcardPolicy;
  smartCard: EffectiveSmartCardPolicy;
  organisation: EffectiveOrganisationPolicy;
  event: EffectiveEventPolicy;
  emailSignature: EffectiveEmailSignaturePolicy;
  virtualBackground: EffectiveVirtualBackgroundPolicy;
  leadsViewAccess: boolean;
}

export interface PlanPurchaseHistoryEntry {
  id: string;
  planId: string;
  planName: string;
  startedAt: string;
  expiresAt: string | null;
  businessModelTypeAtPurchase: PlanBusinessModelType;
  assignedByEmployeeId: string;
}

export interface BulkAssignCustomersToPlanPayload {
  customerIds: string[];
}

export interface BulkAssignCustomersToPlanResult {
  assignedCount: number;
}
