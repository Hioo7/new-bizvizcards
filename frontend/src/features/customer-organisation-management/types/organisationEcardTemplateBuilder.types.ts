import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";
import type { ECardHeroLayout } from "@app-types/ecard";
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
