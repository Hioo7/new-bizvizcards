import { useNavigate, useParams } from "react-router-dom";
import {
  ADMIN_ORGANISATION_EXCHANGE_CONTACT_FORM_TEMPLATE_API,
  OrganisationExchangeContactFormTemplateBuilderView,
} from "@features/organisation-exchange-contact-form-template";
import { adminOrganisationDetailPath } from "@config/routes";

export default function OrganisationExchangeContactFormTemplatePage() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const navigate = useNavigate();

  if (!organisationId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing organisation.</p>
      </div>
    );
  }

  return (
    <OrganisationExchangeContactFormTemplateBuilderView
      organisationId={organisationId}
      api={ADMIN_ORGANISATION_EXCHANGE_CONTACT_FORM_TEMPLATE_API}
      onBack={() => navigate(adminOrganisationDetailPath(organisationId))}
    />
  );
}
