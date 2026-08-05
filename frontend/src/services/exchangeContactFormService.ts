import { EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  CreateExchangeContactFormPayload,
  ExchangeContactForm,
  ExchangeContactFormVersionSummary,
  UpdateExchangeContactFormPayload,
  UpdateExchangeContactFormResult,
} from "@app-types/exchangeContactForm";

export function listExchangeContactForms(
  customerId: string,
): Promise<ExchangeContactForm[]> {
  const params = new URLSearchParams({ customerId });
  return apiRequest<ExchangeContactForm[]>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getExchangeContactForm(
  formId: string,
): Promise<ExchangeContactForm> {
  return apiRequest<ExchangeContactForm>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}/${formId}`,
    { method: "GET" },
  );
}

export function createExchangeContactForm(
  payload: CreateExchangeContactFormPayload,
): Promise<ExchangeContactForm> {
  return apiRequest<ExchangeContactForm>(
    EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateExchangeContactForm(
  formId: string,
  payload: UpdateExchangeContactFormPayload,
): Promise<UpdateExchangeContactFormResult> {
  return apiRequest<UpdateExchangeContactFormResult>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}/${formId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteExchangeContactForm(formId: string): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}/${formId}`,
    { method: "DELETE" },
  );
}

export function listExchangeContactFormVersions(
  formId: string,
): Promise<ExchangeContactFormVersionSummary[]> {
  return apiRequest<ExchangeContactFormVersionSummary[]>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}/${formId}/versions`,
    { method: "GET" },
  );
}

export function deleteExchangeContactFormVersion(
  formId: string,
  versionId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}/${formId}/versions/${versionId}`,
    { method: "DELETE" },
  );
}

export function setExchangeContactFormLinkedEcards(
  formId: string,
  ecardIds: string[],
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_EXCHANGE_CONTACT_FORMS_BASE_PATH}/${formId}/linked-ecards`,
    {
      method: "PUT",
      body: JSON.stringify({ ecardIds }),
    },
  );
}
