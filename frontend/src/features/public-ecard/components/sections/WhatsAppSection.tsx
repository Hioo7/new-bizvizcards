import whatsAppDecorativeIcon from "@assets/icons/ecard-whatsapp-icon2.png";
import whatsAppLogo from "@assets/icons/ecard-whatsapp-logo.png";
import { buildEcardWhatsAppLink } from "@features/public-ecard/utils/buildEcardWhatsAppLink";
import type { EcardWhatsAppComponent } from "@app-types/ecard";

interface WhatsAppSectionProps {
  component: EcardWhatsAppComponent;
  heroName: string;
}

export function WhatsAppSection({ component, heroName }: WhatsAppSectionProps) {
  if (!component.phoneCountryDialCode || !component.phoneNumber) return null;

  const href = buildEcardWhatsAppLink(
    component.phoneCountryDialCode,
    component.phoneNumber,
    heroName,
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl border border-base-300 bg-base-100 px-6 pb-6 shadow-xl"
    >
      <img src={whatsAppDecorativeIcon} alt="" className="block h-10 w-auto" />
      <p className="mt-2 text-3xl font-normal leading-tight md:text-5xl">
        Connect with me on
      </p>
      <p className="mt-1 flex items-center gap-3 text-3xl font-normal leading-tight text-primary md:text-5xl">
        WhatsApp
        <img src={whatsAppLogo} alt="WhatsApp" className="h-10 w-10" />
      </p>
    </a>
  );
}
