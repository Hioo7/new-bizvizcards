// A card with no uploaded image still gets a thumbnail in link previews,
// rather than omitting og:image entirely — resolved through the same
// MediaService/storage-provider public-URL path used for real uploads.
// Shared across every module that server-renders an Open Graph preview
// (smart cards, e-cards, ...).
export const DEFAULT_OG_IMAGE_STORAGE_KEY = 'defaults/og-preview-fallback.png';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
