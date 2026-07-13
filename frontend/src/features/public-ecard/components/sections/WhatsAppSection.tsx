import { Sparkles } from "lucide-react";
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

// Mirrors the legacy E-card's WhatsApp CTA panel structure and scale
// (fixed h-60 card, text-3xl/md:text-5xl heading, w-10 h-10 inline brand
// icon, rounded-2xl) exactly — only the palette changes, from legacy's
// near-black panel to the E-card's light theme.
export function WhatsAppSection({ component }: WhatsAppSectionProps) {
  if (!component.phoneCountryDialCode || !component.phoneNumber) return null;

  const href = buildWhatsAppLink(
    component.phoneCountryDialCode,
    component.phoneNumber,
  );

  return (
    <div className="px-6 py-4 bg-white border-b">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <div className="w-full h-60 bg-indigo-50 shadow-xl rounded-2xl px-6 border border-indigo-100">
          <div className="pt-4">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div>
              <h1 className="text-3xl md:text-5xl text-gray-800">
                Connect with me on
              </h1>
            </div>
            <div>
              <span className="text-indigo-600 flex items-center gap-3 text-3xl md:text-5xl">
                WhatsApp
                <WhatsAppIcon className="w-10 h-10 text-green-600" />
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
