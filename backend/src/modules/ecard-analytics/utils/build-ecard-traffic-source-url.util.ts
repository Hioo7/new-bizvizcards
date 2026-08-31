import {
  ECARD_TRAFFIC_SOURCE_QUERY_PARAM,
  ECARD_TRAFFIC_SOURCE_REF_QUERY_PARAM,
} from '../ecard-analytics.constants';

/**
 * Appends the `?src=<token>&sref=<refId>` attribution params to a public
 * e-card URL. Used when baking a QR code that must be traceable back to the
 * artifact it was printed on (e.g. a virtual background).
 *
 * `baseUrl` must be an absolute URL (it comes from validated config); `new
 * URL` handles encoding and any query string already present.
 */
export function buildEcardTrafficSourceUrl(
  baseUrl: string,
  srcToken: string,
  refId: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set(ECARD_TRAFFIC_SOURCE_QUERY_PARAM, srcToken);
  url.searchParams.set(ECARD_TRAFFIC_SOURCE_REF_QUERY_PARAM, refId);
  return url.toString();
}
