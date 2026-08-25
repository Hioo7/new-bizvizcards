import { useState } from "react";
import { EcardExchangeContactPopup } from "@features/public-ecard/components/EcardExchangeContactPopup";
import { DynamicExchangeContactPopup } from "@features/public-ecard/components/DynamicExchangeContactPopup";
import { useExchangeContactTimer } from "@hooks/useExchangeContactTimer";
import {
  ecardVCardUrl,
  submitCustomFormExchangeContact,
  submitEcardExchangeContact,
} from "@services/publicEcardService";
import { useAutoDownloadContact } from "@features/public-ecard/hooks/useAutoDownloadContact";
import { buildEcardWhatsAppLink } from "@features/public-ecard/utils/buildEcardWhatsAppLink";
import { HeroSection } from "@features/public-ecard/components/sections/HeroSection";
import { BannerHeroSection } from "@features/public-ecard/components/sections/BannerHeroSection";
import { BannerProfileHeroSection } from "@features/public-ecard/components/sections/BannerProfileHeroSection";
import { OrgBadgeHeroSection } from "@features/public-ecard/components/sections/OrgBadgeHeroSection";
import { AboutSection } from "@features/public-ecard/components/sections/AboutSection";
import { SocialLinksSection } from "@features/public-ecard/components/sections/SocialLinksSection";
import { GallerySection } from "@features/public-ecard/components/sections/GallerySection";
import { VideoSection } from "@features/public-ecard/components/sections/VideoSection";
import { VideoGallerySection } from "@features/public-ecard/components/sections/VideoGallerySection";
import { TeamSection } from "@features/public-ecard/components/sections/TeamSection";
import { WhatsAppSection } from "@features/public-ecard/components/sections/WhatsAppSection";
import { BrochureSection } from "@features/public-ecard/components/sections/BrochureSection";
import { LocationTileSection } from "@features/public-ecard/components/sections/LocationTileSection";
import { ReviewLinkSection } from "@features/public-ecard/components/sections/ReviewLinkSection";
import { TestimonialsSection } from "@features/public-ecard/components/sections/TestimonialsSection";
import { ECARD_THEME_TO_DAISYUI_THEME } from "@features/public-ecard/config";
import type { Ecard, EcardComponent } from "@app-types/ecard";
import type { PublicExchangeContactForm } from "@app-types/exchangeContactForm";
import type { CSSProperties } from "react";

interface HeroProps {
  hero: Ecard["hero"];
  endpoint: string;
  canExchangeContact: boolean;
  onExchangeContact: () => void;
}

function renderHero(props: HeroProps) {
  switch (props.hero.layout) {
    case "BANNER":
      return <BannerHeroSection {...props} />;
    case "BANNER_PROFILE":
      return <BannerProfileHeroSection {...props} />;
    case "ORG_BADGE":
      return <OrgBadgeHeroSection {...props} />;
    case "DEFAULT":
      return <HeroSection {...props} />;
  }
}

function renderComponent(
  component: EcardComponent,
  heroName: string,
  iconShape: Ecard["hero"]["iconShape"],
) {
  switch (component.type) {
    case "ABOUT":
      return <AboutSection key={component.id} component={component} />;
    case "SOCIAL_LINKS":
      return (
        <SocialLinksSection
          key={component.id}
          component={component}
          iconShape={iconShape}
        />
      );
    case "GALLERY":
      return <GallerySection key={component.id} component={component} />;
    case "VIDEO":
      return <VideoSection key={component.id} component={component} />;
    case "VIDEO_GALLERY":
      return <VideoGallerySection key={component.id} component={component} />;
    case "TEAM":
      return <TeamSection key={component.id} component={component} />;
    case "WHATSAPP":
      return <WhatsAppSection key={component.id} component={component} heroName={heroName} />;
    case "BROCHURE":
      return <BrochureSection key={component.id} component={component} />;
    case "LOCATION_TILE":
      return <LocationTileSection key={component.id} component={component} />;
    case "REVIEW_LINK":
      return <ReviewLinkSection key={component.id} component={component} />;
    case "TESTIMONIALS":
      return <TestimonialsSection key={component.id} component={component} />;
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
            className="text-primary underline"
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
          className="text-primary underline"
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
  exchangeContactForm: PublicExchangeContactForm | null;
}

export function EcardRenderer({
  card,
  exchangeContactAllowed,
  exchangeContactForm,
}: EcardRendererProps) {
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

  // Card-wide custom hex overrides, applied as CSS custom properties on the
  // root element so every existing `text-base-content`/`text-primary` class
  // downstream picks them up automatically (no per-component changes needed)
  // — the same technique already used for heroBannerFallbackColor.
  // primaryAccentColor overrides the main text/icon color (today's "white"
  // — base-content); secondaryAccentColor overrides the highlight color used
  // for the name, About section, and button link text (today's "blue" —
  // primary). Names mirror the two accent colors as described by the
  // product brief, not a 1:1 match to the daisyUI token names they target.
  const accentColorStyle = {
    ...(card.hero.primaryAccentColor && {
      "--color-base-content": card.hero.primaryAccentColor,
    }),
    ...(card.hero.secondaryAccentColor && {
      "--color-primary": card.hero.secondaryAccentColor,
    }),
  } as CSSProperties;

  return (
    <div
      data-theme={ECARD_THEME_TO_DAISYUI_THEME[card.hero.theme]}
      style={accentColorStyle}
      className="min-h-screen overflow-x-hidden bg-gradient-to-r from-neutral via-secondary to-neutral text-base-content"
    >
      <div className="px-4 md:px-48 pt-6 md:pt-20">
        {renderHero({
          hero: card.hero,
          endpoint: card.endpoint,
          canExchangeContact,
          onExchangeContact: () => setIsExchangeOpen(true),
        })}
        <div className="mt-6 space-y-2">
          {card.components.map((component) =>
            renderComponent(component, card.hero.name, card.hero.iconShape),
          )}
        </div>
        <EcardFooter whatsappHref={whatsappHref} />
      </div>

      {exchangeContactForm ? (
        <DynamicExchangeContactPopup
          isOpen={isExchangeOpen}
          form={exchangeContactForm}
          vcardUrl={ecardVCardUrl(card.endpoint)}
          onSubmit={(payload) =>
            submitCustomFormExchangeContact(card.endpoint, payload)
          }
          onClose={() => setIsExchangeOpen(false)}
        />
      ) : (
        <EcardExchangeContactPopup
          isOpen={isExchangeOpen}
          vcardUrl={ecardVCardUrl(card.endpoint)}
          onSubmit={(payload) => submitEcardExchangeContact(card.endpoint, payload)}
          onClose={() => setIsExchangeOpen(false)}
        />
      )}
    </div>
  );
}
