import {
  deleteMyOrganisationExchangeContactFormTemplate,
  getMyOrganisationExchangeContactFormTemplate,
  updateMyOrganisationExchangeContactFormTemplate,
} from "@services/organisationExchangeContactFormTemplateService";
import {
  OrganisationExchangeContactFormTemplateBuilderView,
  type OrganisationExchangeContactFormTemplateBuilderApi,
} from "@features/organisation-exchange-contact-form-template";

// Stable reference — recreating this object per render would re-trigger the
// builder hook's load effect on every render, same convention as
// EcardBrandingPanel.tsx's CUSTOMER_ECARD_TEMPLATE_API.
const CUSTOMER_EXCHANGE_CONTACT_FORM_TEMPLATE_API: OrganisationExchangeContactFormTemplateBuilderApi =
  {
    get: getMyOrganisationExchangeContactFormTemplate,
    upsert: updateMyOrganisationExchangeContactFormTemplate,
    delete: deleteMyOrganisationExchangeContactFormTemplate,
  };

interface ExchangeContactFormBrandingPanelProps {
  organisationId: string;
}

export default function ExchangeContactFormBrandingPanel({
  organisationId,
}: ExchangeContactFormBrandingPanelProps) {
  return (
    <OrganisationExchangeContactFormTemplateBuilderView
      organisationId={organisationId}
      api={CUSTOMER_EXCHANGE_CONTACT_FORM_TEMPLATE_API}
    />
  );
}
