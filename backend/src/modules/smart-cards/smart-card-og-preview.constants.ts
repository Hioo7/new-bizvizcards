export const OG_PREVIEW_FALLBACK_TITLE = 'Business Card';

export function ogPreviewFallbackDescription(title: string): string {
  return `Visit ${title}'s business card`;
}

// A card with no uploaded logo still gets a thumbnail in link previews,
// rather than omitting og:image entirely — resolved through the same
// MediaService/storage-provider public-URL path used for real uploads.
export const DEFAULT_OG_IMAGE_STORAGE_KEY = 'defaults/og-preview-fallback.png';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Must stay in sync with the frontend's `smartCardPublic` route
// (frontend/src/config/routes.ts) — the two projects don't share code, so
// this is a deliberate duplication, not an oversight.
export const SMART_CARD_PUBLIC_PAGE_PATH_PREFIX = '/smartcard';
