import { PUBLIC_SMART_CARDS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { PublicSmartCard } from "@app-types/smartCard";

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
