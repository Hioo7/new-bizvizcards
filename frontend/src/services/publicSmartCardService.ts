import { PUBLIC_SMART_CARDS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { PublicSmartCard } from "@app-types/smartCard";
import type { ExchangeContactSubmission } from "@app-types/lead";

export function getPublicSmartCard(
  endpoint: string,
): Promise<PublicSmartCard> {
  return apiRequest<PublicSmartCard>(
    `${PUBLIC_SMART_CARDS_BASE_PATH}/${endpoint}`,
    { method: "GET" },
  );
}

export function smartCardVCardUrl(endpoint: string): string {
  return `${PUBLIC_SMART_CARDS_BASE_PATH}/${endpoint}/vcard`;
}

export function submitExchangeContact(
  endpoint: string,
  payload: ExchangeContactSubmission,
): Promise<void> {
  return apiRequest<void>(
    `${PUBLIC_SMART_CARDS_BASE_PATH}/${endpoint}/exchange-contact`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
