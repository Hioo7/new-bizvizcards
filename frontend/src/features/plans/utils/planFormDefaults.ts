import type {
  CreatePlanPayload,
  EcardPolicy,
  EventPolicy,
  OrganisationPolicy,
  SmartCardPolicy,
} from "@app-types/plan";
import { DEFAULT_GALLERY_LIMITS, ECARD_COMPONENT_TYPES } from "@features/plans/config";

export function createDefaultEcardPolicy(): EcardPolicy {
  return {
    isAvailable: true,
    maxEcards: 1,
    exchangeContactAccess: true,
    componentAvailabilities: ECARD_COMPONENT_TYPES.map((type) => ({
      type,
      isAvailable: true,
      ...(type === "GALLERY" && { galleryLimits: DEFAULT_GALLERY_LIMITS }),
    })),
  };
}

export function createDefaultSmartCardPolicy(): SmartCardPolicy {
  return {
    isAvailable: true,
    maxSmartCards: 1,
    exchangeContactAccess: true,
    whitelistedTemplateIds: [],
  };
}

export function createDefaultOrganisationPolicy(): OrganisationPolicy {
  return {
    isAvailable: false,
    maxOrgsCanJoin: 0,
    maxOrgsCanCreate: 0,
    orgEcardPolicy: createDefaultEcardPolicy(),
    orgSmartCardPolicy: createDefaultSmartCardPolicy(),
  };
}

export function createDefaultEventPolicy(): EventPolicy {
  return {
    isAvailable: false,
    maxEvents: 0,
    maxGuestsPerEvent: 0,
  };
}

export function createDefaultPlanDraft(): CreatePlanPayload {
  return {
    name: "",
    price: 0,
    businessModelType: "ONE_TIME",
    isPublic: false,
    ecardPolicy: createDefaultEcardPolicy(),
    smartCardPolicy: createDefaultSmartCardPolicy(),
    organisationPolicy: createDefaultOrganisationPolicy(),
    eventPolicy: createDefaultEventPolicy(),
  };
}
