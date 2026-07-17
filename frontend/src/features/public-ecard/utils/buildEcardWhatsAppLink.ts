/** Matches legacy's exact wa.me link + prefilled message (see
 * legacy-artifacts/cards-app/src/components/cardone.template/template.tsx),
 * reused by both the WhatsApp CTA block and the footer's "bizvizcards" link. */
export function buildEcardWhatsAppLink(
  dialCode: string,
  phoneNumber: string,
  heroName: string,
): string {
  const digits = `${dialCode}${phoneNumber}`.replace(/\D/g, "");
  const message = `Hello ${heroName}, got your contact from bizvizCards.com`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
