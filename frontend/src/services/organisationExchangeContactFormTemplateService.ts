import { EMPLOYEE_ORGANISATIONS_BASE_PATH, ORGANISATIONS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  ExchangeContactForm,
  UpdateExchangeContactFormResult,
  UpsertOrganisationExchangeContactFormTemplatePayload,
} from "@app-types/exchangeContactForm";

export function getOrganisationExchangeContactFormTemplate(
  organisationId: string,
): Promise<ExchangeContactForm | null> {
  return apiRequest<ExchangeContactForm | null>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/exchange-contact-form-template`,
    { method: "GET" },
  );
}

export function upsertOrganisationExchangeContactFormTemplate(
  organisationId: string,
  payload: UpsertOrganisationExchangeContactFormTemplatePayload,
): Promise<UpdateExchangeContactFormResult> {
  return apiRequest<UpdateExchangeContactFormResult>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/exchange-contact-form-template`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteOrganisationExchangeContactFormTemplate(
  organisationId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/exchange-contact-form-template`,
    { method: "DELETE" },
  );
}

// SPOC-side (customer-authenticated) variants — same endpoint shape as the
// admin ones above, scoped to ORGANISATIONS_BASE_PATH. The backend enforces
// the actual SPOC-only/member-only checks
// (organisationsService.assertIsSpoc/assertIsMember).
export function getMyOrganisationExchangeContactFormTemplate(
  organisationId: string,
): Promise<ExchangeContactForm | null> {
  return apiRequest<ExchangeContactForm | null>(
    `${ORGANISATIONS_BASE_PATH}/${organisationId}/exchange-contact-form-template`,
    { method: "GET" },
  );
}

export function updateMyOrganisationExchangeContactFormTemplate(
  organisationId: string,
  payload: UpsertOrganisationExchangeContactFormTemplatePayload,
): Promise<UpdateExchangeContactFormResult> {
  return apiRequest<UpdateExchangeContactFormResult>(
    `${ORGANISATIONS_BASE_PATH}/${organisationId}/exchange-contact-form-template`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteMyOrganisationExchangeContactFormTemplate(
  organisationId: string,
): Promise<void> {
  return apiRequest<void>(
    `${ORGANISATIONS_BASE_PATH}/${organisationId}/exchange-contact-form-template`,
    { method: "DELETE" },
  );
}
