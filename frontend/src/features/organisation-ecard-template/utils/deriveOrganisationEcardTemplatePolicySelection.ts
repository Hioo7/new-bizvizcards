import { ECARD_COMPONENT_TYPES } from "@features/ecards";
import type { EffectivePolicy } from "@app-types/plan";
import type { OrganisationEcardTemplatePolicySelection } from "@features/organisation-ecard-template/types/organisationEcardTemplateBuilder.types";

export const EMPTY_ORGANISATION_ECARD_TEMPLATE_POLICY_SELECTION: OrganisationEcardTemplatePolicySelection =
  {
    planUnavailableTypes: [],
    availableHeroLayouts: null,
    availableThemes: null,
    availableIconShapes: null,
    accentColorCustomizationAvailable: false,
    accentColorPresets: [],
  };

export function deriveOrganisationEcardTemplatePolicySelection(
  policy: EffectivePolicy,
): OrganisationEcardTemplatePolicySelection {
  const orgEcardPolicy = policy.organisation.orgEcardPolicy;
  return {
    planUnavailableTypes: ECARD_COMPONENT_TYPES.filter(
      (type) => orgEcardPolicy.components[type] === false,
    ),
    availableHeroLayouts: orgEcardPolicy.heroLayouts,
    availableThemes: orgEcardPolicy.themes,
    availableIconShapes: orgEcardPolicy.iconShapes,
    accentColorCustomizationAvailable:
      orgEcardPolicy.accentColorCustomizationAvailable,
    accentColorPresets: orgEcardPolicy.accentColorPresets,
  };
}
