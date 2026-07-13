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

export function WhatsAppSection({ component }: WhatsAppSectionProps) {
  if (!component.phoneCountryDialCode || !component.phoneNumber) return null;

  const href = buildWhatsAppLink(
    component.phoneCountryDialCode,
    component.phoneNumber,
  );

  return (
    <div className="px-6 py-6 bg-white border-b">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl border border-indigo-100 bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8 text-center shadow-sm transition hover:shadow-md"
      >
        <Sparkles className="mx-auto mb-3 h-6 w-6 text-indigo-400" />
        <p className="text-2xl font-bold text-gray-800">Connect with me on</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-indigo-600">
          WhatsApp
          <WhatsAppIcon className="h-7 w-7 text-green-600" />
        </p>
      </a>
    </div>
  );
}
