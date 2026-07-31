import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrganisation } from "@services/organisationService";
import { getCustomerEffectivePolicy } from "@services/planService";
import {
  deleteOrganisationEcardTemplate,
  getOrganisationEcardTemplate,
  updateOrganisationEcardTemplate,
} from "@services/organisationEcardTemplateService";
import { adminOrganisationDetailPath } from "@config/routes";
import {
  OrganisationEcardTemplateBuilderView,
  deriveOrganisationEcardTemplatePolicySelection,
  EMPTY_ORGANISATION_ECARD_TEMPLATE_POLICY_SELECTION,
  type OrganisationEcardTemplateBuilderApi,
  type OrganisationEcardTemplatePolicySelection,
} from "@features/organisation-ecard-template";
import type { OrganisationSummary } from "@app-types/organisation";

// Stable reference — recreating this object per render would re-trigger the
// builder hook's load effect on every render (see useOrganisationEcardTemplateBuilder).
const ADMIN_ECARD_TEMPLATE_API: OrganisationEcardTemplateBuilderApi = {
  get: getOrganisationEcardTemplate,
  update: updateOrganisationEcardTemplate,
  delete: deleteOrganisationEcardTemplate,
};

export default function OrganisationEcardTemplatePage() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const navigate = useNavigate();
  const [organisation, setOrganisation] = useState<OrganisationSummary | null>(
    null,
  );

  useEffect(() => {
    if (!organisationId) return;
    let cancelled = false;
    void getOrganisation(organisationId).then((org) => {
      if (!cancelled) setOrganisation(org);
    });
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  const loadPolicy = useCallback(async (): Promise<
    OrganisationEcardTemplatePolicySelection
  > => {
    if (!organisation?.createdByCustomerId) {
      return EMPTY_ORGANISATION_ECARD_TEMPLATE_POLICY_SELECTION;
    }
    // The "guiding hand" requirement: only component types/layouts the org's
    // own plan boost allows are offered here — the same effective policy
    // already resolved for individual e-cards, just reused read-only.
    const policy = await getCustomerEffectivePolicy(
      organisation.createdByCustomerId,
    );
    return deriveOrganisationEcardTemplatePolicySelection(policy);
  }, [organisation]);

  if (!organisationId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing organisation.</p>
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
        <p className="text-sm text-base-content/50">Loading…</p>
      </div>
    );
  }

  return (
    <OrganisationEcardTemplateBuilderView
      organisationId={organisationId}
      organisationName={organisation.name}
      api={ADMIN_ECARD_TEMPLATE_API}
      loadPolicy={loadPolicy}
      onBack={() => navigate(adminOrganisationDetailPath(organisationId))}
      teamPickerScope="employee"
    />
  );
}
