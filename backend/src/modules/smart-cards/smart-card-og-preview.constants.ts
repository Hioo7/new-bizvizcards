export const OG_PREVIEW_FALLBACK_TITLE = 'Business Card';

export function ogPreviewFallbackDescription(title: string): string {
  return `Visit ${title}'s business card`;
}

// Must stay in sync with the frontend's `smartCardPublic` route
// (frontend/src/config/routes.ts) — the two projects don't share code, so
// this is a deliberate duplication, not an oversight.
export const SMART_CARD_PUBLIC_PAGE_PATH_PREFIX = '/smartcard';
