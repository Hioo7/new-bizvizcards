import { useState } from "react";
import { HeroSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/HeroSection";
import { SocialSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/SocialSection";
import { ContactFooterSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/ContactFooterSection";
import { GalleriesSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/GalleriesSection";
import { ServicesSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/ServicesSection";
import { AboutSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/AboutSection";
import { InquiryModal } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/InquiryModal";
import { TestimonialsSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/TestimonialsSection";
import { FounderSection } from "@features/public-smart-card/components/templates/interior-design-template-2/sections/FounderSection";
import { ExchangeContactPopup } from "@components/ExchangeContactPopup";
import { useExchangeContactTimer } from "@hooks/useExchangeContactTimer";
import { smartCardVCardUrl, submitExchangeContact } from "@services/publicSmartCardService";
import type { PublicSmartCard } from "@app-types/smartCard";

function TemplateFooter() {
  return (
    <footer className="mt-6 w-full bg-white/80 text-center py-2">
      <p className="text-xs text-gray-600">
        Click here to get yours today{" "}
        <a
          className="text-indigo-600 hover:text-indigo-800 font-medium"
          target="_blank"
          rel="noopener noreferrer"
          href="https://api.whatsapp.com/send?phone=916363797685&text=I%20am%20interested%20in%20purchasing%20your%20e-visiting%20card.%20Could%20you%20please%20provide%20more%20details%3F "
        >
          bizvizcards{" "}
        </a>
        Powered by{" "}
        <a
          href="https://blueticksinnovations.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          blueticksinnovations.com
        </a>
      </p>
    </footer>
  );
}

interface InteriorDesignTemplate2Props {
  card: PublicSmartCard;
}

export function InteriorDesignTemplate2({ card }: InteriorDesignTemplate2Props) {
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const showExchangeButton = Boolean(card.customerId) && card.exchangeContactAllowed;

  useExchangeContactTimer(() => {
    if (showExchangeButton) setIsExchangeOpen(true);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md mx-auto bg-white shadow-2xl rounded-sm overflow-hidden">
        <HeroSection profile={card.profile} />
        <SocialSection socialMedia={card.socialMedia} />
        <ContactFooterSection
          companyName={card.profile?.companyName ?? null}
          endpoint={card.endpoint}
          contact={card.contact}
          socialMedia={card.socialMedia}
          showExchangeButton={showExchangeButton}
          onExchangeContact={() => setIsExchangeOpen(true)}
          showActionSection
          showDetailsSection={false}
        />
        <GalleriesSection galleries={card.galleries} />
        <ServicesSection services={card.services} />
        <AboutSection profile={card.profile} />
        <InquiryModal whatsapp={card.socialMedia?.whatsapp} />
        <TestimonialsSection testimonials={card.testimonials} />
        <FounderSection founder={card.founder} />
        <ContactFooterSection
          companyName={card.profile?.companyName ?? null}
          endpoint={card.endpoint}
          contact={card.contact}
          socialMedia={card.socialMedia}
          showExchangeButton={showExchangeButton}
          onExchangeContact={() => setIsExchangeOpen(true)}
          showActionSection={false}
          showDetailsSection
        />
      </div>
      <TemplateFooter />

      <ExchangeContactPopup
        isOpen={isExchangeOpen}
        vcardUrl={smartCardVCardUrl(card.endpoint)}
        onSubmit={(payload) => submitExchangeContact(card.endpoint, payload)}
        onClose={() => setIsExchangeOpen(false)}
      />
    </div>
  );
}
