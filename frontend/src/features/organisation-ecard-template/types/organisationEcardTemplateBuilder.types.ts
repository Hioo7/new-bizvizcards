import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";
import type {
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  EcardComponentType,
} from "@app-types/ecard";
import type { EcardAccentColorPreset } from "@app-types/plan";
import type {
  OrganisationEcardTemplate,
  OrganisationEcardTemplateImageUpload,
  OrganisationEcardTemplatePayload,
} from "@app-types/organisationEcardTemplate";
import type { BuilderComponent } from "@features/ecards";
import { ECARD_HERO_DEFAULT_FALLBACK_COLOR } from "@features/ecards/config/ecardBuilder.config";

// Same hero identity fields as an e-card's own EcardHeroDraft, minus the
// fields that make no sense for an organisation-wide template (endpoint,
// organisationId, and the two per-card settings booleans, which aren't
// override-capable — see the merge util on the backend). Layout is optional
// here too ("unset" = defer to each member's own card), unlike a real card's
// always-set layout — modeled with a nullable layout instead of a fixed default.
export interface OrganisationEcardTemplateHeroDraft {
  name: string;
  email: string;
  companyName: string;
  photo: ImageFieldValue;
  phoneCountryDialCode: string;
  phoneNumber: string;
  layout: ECardHeroLayout | null;
  banner: ImageFieldValue;
  bannerFallbackColor: string;
  badgeFallbackColor: string;
  theme: ECardTheme | null;
  primaryAccentColor: string | null;
  secondaryAccentColor: string | null;
  iconShape: ECardIconShape | null;
}

export function emptyOrganisationEcardTemplateHeroDraft(): OrganisationEcardTemplateHeroDraft {
  return {
    name: "",
    email: "",
    companyName: "",
    photo: emptyImageField(),
    phoneCountryDialCode: "",
    phoneNumber: "",
    layout: null,
    banner: emptyImageField(),
    bannerFallbackColor: ECARD_HERO_DEFAULT_FALLBACK_COLOR,
    badgeFallbackColor: ECARD_HERO_DEFAULT_FALLBACK_COLOR,
    theme: null,
    primaryAccentColor: null,
    secondaryAccentColor: null,
    iconShape: null,
  };
}

// Components reuse BuilderComponent/ComponentDraft verbatim from the ecards
// feature — the draft shapes are already ecard-agnostic.
export interface OrganisationEcardTemplateBuilderState {
  hero: OrganisationEcardTemplateHeroDraft;
  components: BuilderComponent[];
}

export function emptyOrganisationEcardTemplateBuilderState(): OrganisationEcardTemplateBuilderState {
  return { hero: emptyOrganisationEcardTemplateHeroDraft(), components: [] };
}

// Injected by the caller (admin page vs. customer/SPOC tab) so the builder
// hook/view stay agnostic of which auth scope (employee vs. customer) the
// underlying HTTP calls run under.
export interface OrganisationEcardTemplateBuilderApi {
  get: (organisationId: string) => Promise<OrganisationEcardTemplate | null>;
  update: (
    organisationId: string,
    payload: OrganisationEcardTemplatePayload,
    files: OrganisationEcardTemplateImageUpload[],
  ) => Promise<OrganisationEcardTemplate>;
  delete: (organisationId: string) => Promise<void>;
}

// Same "which layouts/components/etc. does the org's plan boost allow"
// selection the builder view renders with — resolved differently by each
// caller (admin resolves the org creator's plan; the customer/SPOC tab
// resolves its own logged-in customer's plan) but consumed identically here.
export interface OrganisationEcardTemplatePolicySelection {
  planUnavailableTypes: EcardComponentType[];
  availableHeroLayouts: Record<ECardHeroLayout, boolean> | null;
  availableThemes: Record<ECardTheme, boolean> | null;
  availableIconShapes: Record<ECardIconShape, boolean> | null;
  accentColorCustomizationAvailable: boolean;
  accentColorPresets: EcardAccentColorPreset[];
}
