import { useState } from "react";
import { EcardExchangeContactPopup } from "@features/public-ecard/components/EcardExchangeContactPopup";
import { useExchangeContactTimer } from "@hooks/useExchangeContactTimer";
import { ecardVCardUrl, submitEcardExchangeContact } from "@services/publicEcardService";
import { useAutoDownloadContact } from "@features/public-ecard/hooks/useAutoDownloadContact";
import { buildEcardWhatsAppLink } from "@features/public-ecard/utils/buildEcardWhatsAppLink";
import { HeroSection } from "@features/public-ecard/components/sections/HeroSection";
import { AboutSection } from "@features/public-ecard/components/sections/AboutSection";
import { SocialLinksSection } from "@features/public-ecard/components/sections/SocialLinksSection";
import { GallerySection } from "@features/public-ecard/components/sections/GallerySection";
import { VideoSection } from "@features/public-ecard/components/sections/VideoSection";
import { TeamSection } from "@features/public-ecard/components/sections/TeamSection";
import { WhatsAppSection } from "@features/public-ecard/components/sections/WhatsAppSection";
import { BrochureSection } from "@features/public-ecard/components/sections/BrochureSection";
import type { Ecard, EcardComponent } from "@app-types/ecard";

function renderComponent(component: EcardComponent, heroName: string) {
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
      return <WhatsAppSection key={component.id} component={component} heroName={heroName} />;
    case "BROCHURE":
      return <BrochureSection key={component.id} component={component} />;
  }
}

interface EcardFooterProps {
  /** Legacy's "bizvizcards" link reused the eCard's own WhatsApp CTA link —
   * only available when a WHATSAPP component is configured on this card. */
  whatsappHref: string | null;
}

function EcardFooter({ whatsappHref }: EcardFooterProps) {
  return (
    <footer className="mt-10 text-sm text-base-content/60 text-center px-4 pb-6">
      <p>
        Click here to get yours today{" "}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            bizvizcards
          </a>
        ) : (
          <span>bizvizcards</span>
        )}
      </p>
      <p>
        Powered by{" "}
        <a
          href="https://blueticksinnovations.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          blueticksinnovations.com
        </a>
      </p>
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

  const whatsappComponent = card.components.find((c) => c.type === "WHATSAPP");
  const whatsappHref =
    whatsappComponent?.type === "WHATSAPP" &&
    whatsappComponent.phoneCountryDialCode &&
    whatsappComponent.phoneNumber
      ? buildEcardWhatsAppLink(
          whatsappComponent.phoneCountryDialCode,
          whatsappComponent.phoneNumber,
          card.hero.name,
        )
      : null;

  return (
    <div
      data-theme="ecard-legacy"
      className="min-h-screen bg-gradient-to-r from-neutral via-secondary to-neutral text-base-content"
    >
      <div className="px-4 md:px-48 pt-6 md:pt-20">
        <HeroSection
          hero={card.hero}
          endpoint={card.endpoint}
          canExchangeContact={canExchangeContact}
          onExchangeContact={() => setIsExchangeOpen(true)}
        />
        <div className="mt-6 space-y-2">
          {card.components.map((component) => renderComponent(component, card.hero.name))}
        </div>
        <EcardFooter whatsappHref={whatsappHref} />
      </div>

      <EcardExchangeContactPopup
        isOpen={isExchangeOpen}
        vcardUrl={ecardVCardUrl(card.endpoint)}
        onSubmit={(payload) => submitEcardExchangeContact(card.endpoint, payload)}
        onClose={() => setIsExchangeOpen(false)}
      />
    </div>
  );
}
