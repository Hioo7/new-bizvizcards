import { PUBLIC_ECARDS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { Ecard } from "@app-types/ecard";
import type { ExchangeContactSubmission } from "@app-types/lead";

export function getPublicEcard(endpoint: string): Promise<Ecard> {
  return apiRequest<Ecard>(`${PUBLIC_ECARDS_BASE_PATH}/${endpoint}`, {
    method: "GET",
  });
}

export function ecardVCardUrl(endpoint: string): string {
  return `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}/vcard`;
}

export function submitEcardExchangeContact(
  endpoint: string,
  payload: ExchangeContactSubmission,
): Promise<void> {
  return apiRequest<void>(
    `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}/exchange-contact`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
