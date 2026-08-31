import { ECardTrafficSource } from '../../generated/prisma/client';

export const ECARD_ANALYTICS_DEFAULT_RANGE_DAYS = 30;

// A live business-card view session, not a background tab left open for
// hours — a client-reported duration beyond this is rejected rather than
// silently corrupting the average.
export const ECARD_VIEW_MAX_DURATION_MS = 30 * 60 * 1000;

// Query params a public e-card URL may carry to attribute the visit to a
// source: `?src=<token>&sref=<uuid>`. Kept short so a QR code stays dense.
export const ECARD_TRAFFIC_SOURCE_QUERY_PARAM = 'src';
export const ECARD_TRAFFIC_SOURCE_REF_QUERY_PARAM = 'sref';

// The `src` token baked into a virtual background's QR code.
export const VIRTUAL_BACKGROUND_TRAFFIC_SOURCE_QUERY_TOKEN =
  'virtual-background';

// Maps a recognised `src` token to its enum value. An unrecognised (or
// absent) token resolves to DIRECT — a public visitor is never rejected over
// a bad attribution param.
export const ECARD_TRAFFIC_SOURCE_BY_QUERY_TOKEN: Readonly<
  Record<string, ECardTrafficSource>
> = {
  [VIRTUAL_BACKGROUND_TRAFFIC_SOURCE_QUERY_TOKEN]:
    ECardTrafficSource.VIRTUAL_BACKGROUND,
};

export interface EcardEventAttribution {
  source: ECardTrafficSource;
  sourceRefId: string | null;
}

export const DEFAULT_ECARD_EVENT_ATTRIBUTION: EcardEventAttribution = {
  source: ECardTrafficSource.DIRECT,
  sourceRefId: null,
};
