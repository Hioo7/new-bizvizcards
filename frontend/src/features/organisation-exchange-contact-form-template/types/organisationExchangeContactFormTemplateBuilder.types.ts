import type {
  ExchangeContactForm,
  UpdateExchangeContactFormResult,
  UpsertOrganisationExchangeContactFormTemplatePayload,
} from "@app-types/exchangeContactForm";

// Injected by the caller (admin page vs. customer/SPOC branding tab) so the
// builder hook/view stay agnostic of which auth scope (employee vs.
// customer) the underlying HTTP calls run under — mirrors
// OrganisationEcardTemplateBuilderApi's exact "inject a bound api object"
// pattern.
export interface OrganisationExchangeContactFormTemplateBuilderApi {
  get: (organisationId: string) => Promise<ExchangeContactForm | null>;
  upsert: (
    organisationId: string,
    payload: UpsertOrganisationExchangeContactFormTemplatePayload,
  ) => Promise<UpdateExchangeContactFormResult>;
  delete: (organisationId: string) => Promise<void>;
}
