/** URI schemes for the direct-contact actions on a lead / contact. */
export const CONTACT_URI_SCHEMES = {
  tel: "tel:",
  sms: "sms:",
  mailto: "mailto:",
} as const;

/**
 * Base for WhatsApp click-to-chat links. A `https://wa.me/<digits>` URL opens
 * the native app on mobile and WhatsApp Web / the desktop app elsewhere,
 * without needing to know what the visitor has installed.
 */
export const WHATSAPP_BASE_URL = "https://wa.me";
