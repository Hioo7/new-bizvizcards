import {
  ECARD_TRAFFIC_SOURCE_PARAM,
  ECARD_TRAFFIC_SOURCE_REF_PARAM,
  type EcardTrafficAttribution,
} from "@config/ecardTraffic";

/**
 * Reads the `?src=&sref=` attribution params off a public e-card URL's query
 * string. Both must be present to count — a lone one is ignored. The values
 * ride along to the view-recording request and every exchange-contact
 * submission so the backend can attribute them (e.g. to a virtual background).
 */
export function readEcardTrafficParams(search: string): EcardTrafficAttribution {
  const params = new URLSearchParams(search);
  const trafficSource = params.get(ECARD_TRAFFIC_SOURCE_PARAM) ?? undefined;
  const trafficSourceRefId =
    params.get(ECARD_TRAFFIC_SOURCE_REF_PARAM) ?? undefined;
  if (!trafficSource || !trafficSourceRefId) return {};
  return { trafficSource, trafficSourceRefId };
}
