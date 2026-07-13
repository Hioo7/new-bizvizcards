import whatsappSparkleIcon from "@assets/icons/whatsapp-sparkle.png";
import { WhatsAppIcon } from "@components/icons/BrandIcons";
import type { EcardWhatsAppComponent } from "@app-types/ecard";

interface WhatsAppSectionProps {
  component: EcardWhatsAppComponent;
}

function buildWhatsAppLink(dialCode: string, phoneNumber: string): string {
  const digits = `${dialCode}${phoneNumber}`.replace(/\D/g, "");
  const message = "Hi, I'd like to connect with you.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Re-themed 1:1 from the legacy E-card's WhatsApp CTA panel (rounded dark
// card, small outlined sparkle top-left, bold two-line "Connect with me on
// / WhatsApp" heading, brand icon inline after the word) — only the near-
// black panel becomes a light card here, nothing else changes.
export function WhatsAppSection({ component }: WhatsAppSectionProps) {
  if (!component.phoneCountryDialCode || !component.phoneNumber) return null;

  const href = buildWhatsAppLink(
    component.phoneCountryDialCode,
    component.phoneNumber,
  );

  return (
    <div className="px-6 py-4 bg-white border-b">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-3xl border border-indigo-100 bg-indigo-50 px-7 py-7"
      >
        {/* The source asset is white-on-transparent, made for legacy's dark
            panel — brightness-0 recolors it to a visible dark silhouette
            against this light card. */}
        <img
          src={whatsappSparkleIcon}
          alt=""
          className="h-8 w-8 brightness-0 opacity-30"
        />
        <p className="mt-3 text-3xl font-bold leading-tight text-gray-900">
          Connect with me on
        </p>
        <p className="mt-1 flex items-center gap-2 text-3xl font-bold leading-tight text-green-600">
          WhatsApp
          <WhatsAppIcon className="h-8 w-8 text-green-600" />
        </p>
      </a>
    </div>
  );
}
