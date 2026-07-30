import type {
  CreatePlanPayload,
  EcardPolicy,
  EventPolicy,
  OrganisationPolicy,
  SmartCardPolicy,
} from "@app-types/plan";
import {
  DEFAULT_ECARD_ACCENT_COLOR_PRESETS,
  DEFAULT_GALLERY_LIMITS,
  ECARD_COMPONENT_TYPES,
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_GATED_ICON_SHAPES,
  ECARD_GATED_THEMES,
} from "@features/plans/config";

export function createDefaultEcardPolicy(): EcardPolicy {
  return {
    isAvailable: true,
    maxEcards: 1,
    exchangeContactAccess: true,
    accentColorCustomizationAvailable: false,
    componentAvailabilities: ECARD_COMPONENT_TYPES.map((type) => ({
      type,
      isAvailable: true,
      ...(type === "GALLERY" && { galleryLimits: DEFAULT_GALLERY_LIMITS }),
    })),
    heroLayoutAvailabilities: ECARD_GATED_HERO_LAYOUTS.map((layout) => ({
      layout,
      isAvailable: false,
    })),
    themeAvailabilities: ECARD_GATED_THEMES.map((theme) => ({
      theme,
      isAvailable: false,
    })),
    iconShapeAvailabilities: ECARD_GATED_ICON_SHAPES.map((iconShape) => ({
      iconShape,
      isAvailable: false,
    })),
    accentColorPresets: DEFAULT_ECARD_ACCENT_COLOR_PRESETS.map((preset) => ({
      ...preset,
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
