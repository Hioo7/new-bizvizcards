import { WHATSAPP_BASE_URL } from "@config/contactChannels";

/**
 * Builds a WhatsApp click-to-chat link from a phone number split into a dial
 * code and a local number (the shape leads and e-cards both store it in).
 *
 * Every non-digit is stripped — `wa.me` wants bare international digits, no
 * `+`, spaces, or dashes. Returns `null` when there are no digits to dial, so
 * callers can disable the action.
 *
 * Pass `message` to pre-fill the chat input; omit it to just open the chat.
 */
export function buildWhatsAppChatLink(
  dialCode: string | null | undefined,
  phoneNumber: string | null | undefined,
  message?: string,
): string | null {
  const digits = `${dialCode ?? ""}${phoneNumber ?? ""}`.replace(/\D/g, "");
  if (!digits) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `${WHATSAPP_BASE_URL}/${digits}${query}`;
}
