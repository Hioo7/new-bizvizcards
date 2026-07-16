import type { EcardComponentType } from "./ecard";
import type { SmartCardTemplateKey } from "./smartCard";

export type PlanBusinessModelType = "ONE_TIME" | "SUBSCRIPTION" | "TRIAL";

export interface GalleryComponentLimits {
  maxGalleries: number;
  maxImagesPerGallery: number;
  maxGallerySizeBytes: number;
}

export interface EcardComponentAvailability {
  type: EcardComponentType;
  isAvailable: boolean;
  // Required iff type === "GALLERY", omitted for every other component type.
  galleryLimits?: GalleryComponentLimits;
}

export interface EcardPolicy {
  isAvailable: boolean;
  maxEcards: number;
  exchangeContactAccess: boolean;
  componentAvailabilities: EcardComponentAvailability[];
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
  components: Record<EcardComponentType, boolean>;
  galleryLimits: GalleryComponentLimits;
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

export interface EffectivePolicy {
  planId: string;
  isFallback: boolean;
  ecard: EffectiveEcardPolicy;
  smartCard: EffectiveSmartCardPolicy;
  organisation: EffectiveOrganisationPolicy;
  event: EffectiveEventPolicy;
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
