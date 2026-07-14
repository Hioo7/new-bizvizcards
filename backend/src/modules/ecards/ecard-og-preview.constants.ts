import { ECARD_GENERIC_LABEL } from './ecards.constants';

export const ECARD_OG_PREVIEW_FALLBACK_TITLE = ECARD_GENERIC_LABEL;

export function ecardOgPreviewFallbackDescription(title: string): string {
  return `Visit ${title}'s digital business card`;
}

// Must stay in sync with the frontend's `ecardPublic` route
// (frontend/src/config/routes.ts) — the two projects don't share code, so
// this is a deliberate duplication, not an oversight.
export const ECARD_PUBLIC_PAGE_PATH_PREFIX = '/ecard';
