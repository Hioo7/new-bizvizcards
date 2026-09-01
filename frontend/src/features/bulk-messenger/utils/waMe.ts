import { WA_ME_BASE_URL } from "@features/bulk-messenger/config/bulkMessenger.config";

// Strips everything but digits from a dial code + number pair, e.g.
// ("+1", "202 555 0100") -> "12025550100".
export function extractPhoneDigits(
  dialCode: string,
  phoneNumber: string,
): string {
  return `${dialCode}${phoneNumber}`.replace(/\D/g, "");
}

export function buildWaMeUrl(digits: string, text: string): string {
  return `${WA_ME_BASE_URL}${digits}?text=${encodeURIComponent(text)}`;
}
