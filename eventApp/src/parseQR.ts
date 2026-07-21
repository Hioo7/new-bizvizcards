import type { ScanPayload } from './types';

/**
 * Parses a scanned QR code string (URL) into a ScanPayload.
 * The QR codes on customer cards are their public card URLs:
 *   - .../ecard/{endpoint}   → ECARD
 *   - .../smart-card/{endpoint} or .../smartcard/{endpoint} → SMART_CARD
 * Returns null if the URL doesn't match a known card pattern.
 */
export function parseQRCode(raw: string): ScanPayload | null {
  const ecardMatch = raw.match(/\/ecard\/([^/?#\s]+)/);
  if (ecardMatch) {
    return { cardType: 'ECARD', endpoint: ecardMatch[1] };
  }

  const smartCardMatch = raw.match(/\/smart-?card\/([^/?#\s]+)/i);
  if (smartCardMatch) {
    return { cardType: 'SMART_CARD', endpoint: smartCardMatch[1] };
  }

  return null;
}
