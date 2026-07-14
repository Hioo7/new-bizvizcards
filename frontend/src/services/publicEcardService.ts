import { PUBLIC_ECARDS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { GetPublicEcardResponse } from "@app-types/ecard";
import type { ExchangeContactSubmission } from "@app-types/lead";

export function getPublicEcard(
  endpoint: string,
): Promise<GetPublicEcardResponse> {
  return apiRequest<GetPublicEcardResponse>(
    `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}`,
    { method: "GET" },
  );
}

export function ecardVCardUrl(endpoint: string): string {
  return `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}/vcard`;
}

/** Fire-and-forget: reports how long a visitor spent on the public card page.
 * `keepalive` is the modern, spec-guaranteed replacement for
 * `navigator.sendBeacon()` for "survive page unload" — it composes directly
 * with the existing apiRequest/fetch call, no separate request plumbing. */
export function reportEcardViewDuration(
  endpoint: string,
  eventId: string,
  durationMs: number,
): Promise<void> {
  return apiRequest<void>(
    `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}/view/${eventId}/duration`,
    {
      method: "POST",
      body: JSON.stringify({ durationMs }),
      keepalive: true,
    },
  );
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
