import { UserRound } from "lucide-react";
import type { ECardIconShape, EcardHero, EcardSocialLinksComponent } from "@app-types/ecard";
import { HeroShareButton } from "@features/public-ecard/components/sections/HeroShareButton";
import { HeroContactActions } from "@features/public-ecard/components/sections/HeroContactActions";

interface BannerHeroSectionProps {
  hero: EcardHero;
  endpoint: string;
  canExchangeContact: boolean;
  onExchangeContact: () => void;
  socialLinksComponent?: EcardSocialLinksComponent;
  iconShape?: ECardIconShape;
}

// Wide banner image up top, hero details below — no profile photo overlap.
export function BannerHeroSection({
  hero,
  endpoint,
  canExchangeContact,
  onExchangeContact,
  socialLinksComponent,
  iconShape,
}: BannerHeroSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100">
        <HeroShareButton title={hero.name} />

        <div
          className="aspect-[21/9] w-full"
          style={{ backgroundColor: hero.bannerFallbackColor ?? undefined }}
        >
          {hero.bannerUrl && (
            <img
              src={hero.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          {!hero.bannerUrl && (
            <span className="flex h-full w-full items-center justify-center">
              <UserRound className="h-10 w-10 text-base-content/40" />
            </span>
          )}
        </div>

        <div className="p-6 text-center md:text-left">
          <h1 className="text-3xl font-bold text-primary break-words">{hero.name}</h1>
          {hero.companyName && (
            <p className="text-sm text-base-content/70 break-words">{hero.companyName}</p>
          )}
        </div>
      </div>

      <HeroContactActions
        endpoint={endpoint}
        canExchangeContact={canExchangeContact}
        onExchangeContact={onExchangeContact}
        socialLinksComponent={socialLinksComponent}
        iconShape={iconShape}
      />
    </div>
  );
}
