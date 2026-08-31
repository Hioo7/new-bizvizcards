import {
  DEFAULT_ECARD_EVENT_ATTRIBUTION,
  ECARD_TRAFFIC_SOURCE_BY_QUERY_TOKEN,
  type EcardEventAttribution,
} from '../ecard-analytics.constants';

/**
 * Resolves the `?src=&sref=` tokens off a public e-card URL / exchange-contact
 * payload into an {@link EcardEventAttribution}.
 *
 * Anything unexpected — an unknown `src` token, a missing `sref`, either one
 * absent — degrades to {@link DEFAULT_ECARD_EVENT_ATTRIBUTION} (DIRECT, no
 * ref). The `sref` is not verified against the database here; a value that
 * matches no real row simply never contributes to any aggregation.
 */
export function resolveEcardTrafficSource(
  srcToken: string | undefined | null,
  refId: string | undefined | null,
): EcardEventAttribution {
  const source = srcToken
    ? ECARD_TRAFFIC_SOURCE_BY_QUERY_TOKEN[srcToken]
    : undefined;
  if (!source || !refId) {
    return DEFAULT_ECARD_EVENT_ATTRIBUTION;
  }
  return { source, sourceRefId: refId };
}
