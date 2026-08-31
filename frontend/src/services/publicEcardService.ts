import {
  ECARD_TRAFFIC_SOURCE_PARAM,
  ECARD_TRAFFIC_SOURCE_REF_PARAM,
  type EcardTrafficAttribution,
} from "@config/ecardTraffic";
import { PUBLIC_ECARDS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { GetPublicEcardResponse } from "@app-types/ecard";
import type { ExchangeContactSubmission } from "@app-types/lead";
import type { SubmitCustomFormExchangeContactPayload } from "@app-types/exchangeContactForm";

export function getPublicEcard(
  endpoint: string,
  attribution?: EcardTrafficAttribution,
): Promise<GetPublicEcardResponse> {
  const query =
    attribution?.trafficSource && attribution.trafficSourceRefId
      ? `?${new URLSearchParams({
          [ECARD_TRAFFIC_SOURCE_PARAM]: attribution.trafficSource,
          [ECARD_TRAFFIC_SOURCE_REF_PARAM]: attribution.trafficSourceRefId,
        }).toString()}`
      : "";
  return apiRequest<GetPublicEcardResponse>(
    `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}${query}`,
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

export function submitCustomFormExchangeContact(
  endpoint: string,
  payload: SubmitCustomFormExchangeContactPayload,
): Promise<void> {
  return apiRequest<void>(
    `${PUBLIC_ECARDS_BASE_PATH}/${endpoint}/custom-form-exchange-contact`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
