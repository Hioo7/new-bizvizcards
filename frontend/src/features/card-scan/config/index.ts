/** Business-card scanner feature constants. */

// Image formats the scanner accepts for the upload fallback. The camera path
// always produces JPEG. (The service also allows bmp/tiff, but there's no
// reason to send those from a browser.)
export const CARD_SCAN_ACCEPT_MIME = "image/jpeg,image/png,image/webp";

// Camera capture output.
export const CARD_SCAN_CAPTURE_TYPE = "image/jpeg";
export const CARD_SCAN_CAPTURE_QUALITY = 0.9;
export const CARD_SCAN_CAPTURE_FILENAME = "card.jpg";

// The real ISO/IEC 7810 ID-1 business-card aspect ratio (85.6 × 53.98 mm).
export const CARD_ASPECT_RATIO = 1.586;

// How long a scan-error toast stays up.
export const SCAN_TOAST_DURATION_MS = 3200;

// Mirrors the backend LEAD_NOTE_MAX_LENGTH — the scanner packs address +
// websites into the prefilled note and must not exceed it.
export const LEAD_NOTE_MAX_LENGTH = 2000;

// Status → user-facing copy for a failed scan.
export const SCAN_ERROR_MESSAGES: Record<number, string> = {
  413: "That image is too large. Try again with a smaller photo.",
  415: "That file type isn't supported. Use a JPEG or PNG.",
  422: "Couldn't read any text on that card. Try a sharper, straighter photo.",
  429: "Too many scans in a row — wait a few seconds and try again.",
  503: "The scanner is busy right now. Try again in a moment.",
  504: "That scan took too long. Try again.",
};

export const SCAN_ERROR_FALLBACK = "Couldn't scan that card. Try again.";
