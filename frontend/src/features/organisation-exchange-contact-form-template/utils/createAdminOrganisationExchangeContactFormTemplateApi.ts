import {
  deleteOrganisationExchangeContactFormTemplate,
  getOrganisationExchangeContactFormTemplate,
  upsertOrganisationExchangeContactFormTemplate,
} from "@services/organisationExchangeContactFormTemplateService";
import type { OrganisationExchangeContactFormTemplateBuilderApi } from "@features/organisation-exchange-contact-form-template/types/organisationExchangeContactFormTemplateBuilder.types";

// No per-caller binding needed (organisationId is passed as an argument at
// call time, not closed over) — a stable module-level constant, same
// convention as OrgBrandingTab.tsx's CUSTOMER_ECARD_TEMPLATE_API.
export const ADMIN_ORGANISATION_EXCHANGE_CONTACT_FORM_TEMPLATE_API: OrganisationExchangeContactFormTemplateBuilderApi =
  {
    get: getOrganisationExchangeContactFormTemplate,
    upsert: upsertOrganisationExchangeContactFormTemplate,
    delete: deleteOrganisationExchangeContactFormTemplate,
  };
