export { default as EcardCustomerPickerView } from "@features/ecards/components/EcardCustomerPickerView";
export { default as EcardListView } from "@features/ecards/components/EcardListView";
export { default as EcardBuilderView } from "@features/ecards/components/EcardBuilderView";

// Builder components — also consumed by the customer-facing ecard builder
export { default as HeroCard } from "@features/ecards/components/HeroCard";
export { default as EcardSettingsCard } from "@features/ecards/components/EcardSettingsCard";
export { default as SortableComponentRow } from "@features/ecards/components/SortableComponentRow";
export { default as ComponentTypePickerModal } from "@features/ecards/components/ComponentTypePickerModal";
export { default as AboutEditSheet } from "@features/ecards/components/AboutEditSheet";
export { default as SocialLinksEditSheet } from "@features/ecards/components/SocialLinksEditSheet";
export { default as VideoEditSheet } from "@features/ecards/components/VideoEditSheet";
export { default as GalleryEditSheet } from "@features/ecards/components/GalleryEditSheet";
export { default as VideoGalleryEditSheet } from "@features/ecards/components/VideoGalleryEditSheet";
export { default as TeamEditSheet } from "@features/ecards/components/TeamEditSheet";
export { default as WhatsAppEditSheet } from "@features/ecards/components/WhatsAppEditSheet";
export { default as BrochureEditSheet } from "@features/ecards/components/BrochureEditSheet";
export { default as HeroLayoutPickerStep } from "@features/ecards/components/HeroLayoutPickerStep";
export { default as HeroThemePickerStep } from "@features/ecards/components/HeroThemePickerStep";
export { default as HeroIconShapePickerStep } from "@features/ecards/components/HeroIconShapePickerStep";
export { default as AccentColorFieldsGroup } from "@features/ecards/components/AccentColorFieldsGroup";
export { default as BannerFieldsGroup } from "@features/ecards/components/BannerFieldsGroup";
export { default as OrgBadgeFieldsGroup } from "@features/ecards/components/OrgBadgeFieldsGroup";

// Types
export type {
  EcardBuilderState,
  BuilderComponent,
  ComponentDraft,
  EcardHeroDraft,
} from "@features/ecards/types/ecardBuilder.types";
export type { OrganisationMembersScope } from "@features/ecards/hooks/useOrganisationMembers";
export {
  emptyDraftForType,
} from "@features/ecards/types/ecardBuilder.types";

// Mapping helpers — reused by the organisation e-card template builder
// (customer-organisation-management), whose component drafts/payloads share
// the exact same per-type shapes as an e-card's own.
export {
  componentToDraft,
  buildImageSlot,
  getHeroValidationErrors,
  getHeroLayoutValidationErrors,
  mapServerFieldErrorsToHeroFields,
} from "@features/ecards/utils/ecardFormMapping";
export {
  normalizeEcardVideoUrl,
  getEcardVideoThumbnailUrl,
} from "@features/ecards/utils/normalizeVideoUrl";

// Schemas
export {
  heroSheetSchema,
  type HeroSheetValues,
  type WhatsAppSheetValues,
  type VideoSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";

// Config
export {
  ECARD_COMPONENT_TYPES,
  ECARD_MAX_COMPONENTS,
  ECARD_TEXT_SHORT_MAX_LENGTH,
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_HERO_FIELDS_INCOMPLETE_MESSAGE,
  ECARD_HERO_LAYOUTS,
  ECARD_HERO_LAYOUT_META,
  ECARD_HERO_THEMES,
  ECARD_HERO_THEME_META,
  ECARD_HERO_ICON_SHAPES,
  ECARD_HERO_ICON_SHAPE_META,
  ECARD_HERO_BANNER_ASPECT,
  ECARD_HERO_BANNER_ASPECT_CLASS,
  ECARD_HERO_DEFAULT_FALLBACK_COLOR,
} from "@features/ecards/config/ecardBuilder.config";
