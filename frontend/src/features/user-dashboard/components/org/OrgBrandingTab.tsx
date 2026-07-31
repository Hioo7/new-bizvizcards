import { useCallback } from "react";
import { getEffectivePolicy } from "@services/planService";
import {
  deleteMyOrganisationEcardTemplate,
  getMyOrganisationEcardTemplate,
  updateMyOrganisationEcardTemplate,
} from "@services/organisationEcardTemplateService";
import {
  OrganisationEcardTemplateBuilderView,
  deriveOrganisationEcardTemplatePolicySelection,
  type OrganisationEcardTemplateBuilderApi,
  type OrganisationEcardTemplatePolicySelection,
} from "@features/organisation-ecard-template";

// Stable reference — recreating this object per render would re-trigger the
// builder hook's load effect on every render (see useOrganisationEcardTemplateBuilder).
const CUSTOMER_ECARD_TEMPLATE_API: OrganisationEcardTemplateBuilderApi = {
  get: getMyOrganisationEcardTemplate,
  update: updateMyOrganisationEcardTemplate,
  delete: deleteMyOrganisationEcardTemplate,
};

interface OrgBrandingTabProps {
  organisationId: string;
  organisationName: string;
}

export default function OrgBrandingTab({
  organisationId,
  organisationName,
}: OrgBrandingTabProps) {
  const loadPolicy = useCallback(
    (): Promise<OrganisationEcardTemplatePolicySelection> =>
      getEffectivePolicy().then(deriveOrganisationEcardTemplatePolicySelection),
    [],
  );

  return (
    <OrganisationEcardTemplateBuilderView
      organisationId={organisationId}
      organisationName={organisationName}
      api={CUSTOMER_ECARD_TEMPLATE_API}
      loadPolicy={loadPolicy}
      teamPickerScope="customer"
    />
  );
}
