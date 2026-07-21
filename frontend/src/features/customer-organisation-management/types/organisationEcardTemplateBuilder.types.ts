import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";
import type { BuilderComponent } from "@features/ecards";

// Same hero identity fields as an e-card's own EcardHeroDraft, minus the
// fields that make no sense for an organisation-wide template (endpoint,
// organisationId, and the two per-card settings booleans, which aren't
// override-capable — see the merge util on the backend).
export interface OrganisationEcardTemplateHeroDraft {
  name: string;
  email: string;
  companyName: string;
  photo: ImageFieldValue;
  phoneCountryDialCode: string;
  phoneNumber: string;
}

export function emptyOrganisationEcardTemplateHeroDraft(): OrganisationEcardTemplateHeroDraft {
  return {
    name: "",
    email: "",
    companyName: "",
    photo: emptyImageField(),
    phoneCountryDialCode: "",
    phoneNumber: "",
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
