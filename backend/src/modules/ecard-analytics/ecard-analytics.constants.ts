export const ECARD_ANALYTICS_DEFAULT_RANGE_DAYS = 30;

// A live business-card view session, not a background tab left open for
// hours — a client-reported duration beyond this is rejected rather than
// silently corrupting the average.
export const ECARD_VIEW_MAX_DURATION_MS = 30 * 60 * 1000;
