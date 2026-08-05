import { EXCHANGE_CONTACT_FORMS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  ExchangeContactForm,
  ExchangeContactFormFieldPayload,
  ExchangeContactFormVersionSummary,
  UpdateExchangeContactFormPayload,
  UpdateExchangeContactFormResult,
} from "@app-types/exchangeContactForm";

const ME_BASE_PATH = `${EXCHANGE_CONTACT_FORMS_BASE_PATH}/me`;

export function listMyExchangeContactForms(): Promise<ExchangeContactForm[]> {
  return apiRequest<ExchangeContactForm[]>(ME_BASE_PATH, { method: "GET" });
}

export function getMyExchangeContactForm(
  formId: string,
): Promise<ExchangeContactForm> {
  return apiRequest<ExchangeContactForm>(`${ME_BASE_PATH}/${formId}`, {
    method: "GET",
  });
}

export function createMyExchangeContactForm(payload: {
  name: string;
  fields: ExchangeContactFormFieldPayload[];
}): Promise<ExchangeContactForm> {
  return apiRequest<ExchangeContactForm>(ME_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMyExchangeContactForm(
  formId: string,
  payload: UpdateExchangeContactFormPayload,
): Promise<UpdateExchangeContactFormResult> {
  return apiRequest<UpdateExchangeContactFormResult>(
    `${ME_BASE_PATH}/${formId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteMyExchangeContactForm(formId: string): Promise<void> {
  return apiRequest<void>(`${ME_BASE_PATH}/${formId}`, { method: "DELETE" });
}

export function listMyExchangeContactFormVersions(
  formId: string,
): Promise<ExchangeContactFormVersionSummary[]> {
  return apiRequest<ExchangeContactFormVersionSummary[]>(
    `${ME_BASE_PATH}/${formId}/versions`,
    { method: "GET" },
  );
}

export function deleteMyExchangeContactFormVersion(
  formId: string,
  versionId: string,
): Promise<void> {
  return apiRequest<void>(
    `${ME_BASE_PATH}/${formId}/versions/${versionId}`,
    { method: "DELETE" },
  );
}

export function setMyExchangeContactFormLinkedEcards(
  formId: string,
  ecardIds: string[],
): Promise<void> {
  return apiRequest<void>(`${ME_BASE_PATH}/${formId}/linked-ecards`, {
    method: "PUT",
    body: JSON.stringify({ ecardIds }),
  });
}
