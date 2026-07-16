import { useState } from "react";
import { ExchangeContactPopup } from "@components/ExchangeContactPopup";
import { useExchangeContactTimer } from "@hooks/useExchangeContactTimer";
import { ecardVCardUrl, submitEcardExchangeContact } from "@services/publicEcardService";
import { useAutoDownloadContact } from "@features/public-ecard/hooks/useAutoDownloadContact";
import { HeroSection } from "@features/public-ecard/components/sections/HeroSection";
import { AboutSection } from "@features/public-ecard/components/sections/AboutSection";
import { SocialLinksSection } from "@features/public-ecard/components/sections/SocialLinksSection";
import { GallerySection } from "@features/public-ecard/components/sections/GallerySection";
import { VideoSection } from "@features/public-ecard/components/sections/VideoSection";
import { TeamSection } from "@features/public-ecard/components/sections/TeamSection";
import { WhatsAppSection } from "@features/public-ecard/components/sections/WhatsAppSection";
import { BrochureSection } from "@features/public-ecard/components/sections/BrochureSection";
import type { Ecard, EcardComponent } from "@app-types/ecard";

function renderComponent(component: EcardComponent) {
  switch (component.type) {
    case "ABOUT":
      return <AboutSection key={component.id} component={component} />;
    case "SOCIAL_LINKS":
      return <SocialLinksSection key={component.id} component={component} />;
    case "GALLERY":
      return <GallerySection key={component.id} component={component} />;
    case "VIDEO":
      return <VideoSection key={component.id} component={component} />;
    case "TEAM":
      return <TeamSection key={component.id} component={component} />;
    case "WHATSAPP":
      return <WhatsAppSection key={component.id} component={component} />;
    case "BROCHURE":
      return <BrochureSection key={component.id} component={component} />;
  }
}

function EcardFooter() {
  return (
    <footer className="mt-6 w-full bg-white/80 text-center py-2">
      <p className="text-xs text-gray-600">Powered by cards-app2</p>
    </footer>
  );
}

interface EcardRendererProps {
  card: Ecard;
  exchangeContactAllowed: boolean;
}

export function EcardRenderer({ card, exchangeContactAllowed }: EcardRendererProps) {
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const canExchangeContact =
    card.hero.isExchangeContactEnabled && exchangeContactAllowed;

  useExchangeContactTimer(() => {
    if (canExchangeContact) setIsExchangeOpen(true);
  });

  useAutoDownloadContact(card);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md mx-auto bg-white shadow-2xl rounded-sm overflow-hidden">
        <HeroSection
          hero={card.hero}
          endpoint={card.endpoint}
          canExchangeContact={canExchangeContact}
          onExchangeContact={() => setIsExchangeOpen(true)}
        />
        {card.components.map(renderComponent)}
      </div>
      <EcardFooter />

      <ExchangeContactPopup
        isOpen={isExchangeOpen}
        vcardUrl={ecardVCardUrl(card.endpoint)}
        onSubmit={(payload) => submitEcardExchangeContact(card.endpoint, payload)}
        onClose={() => setIsExchangeOpen(false)}
      />
    </div>
  );
}
