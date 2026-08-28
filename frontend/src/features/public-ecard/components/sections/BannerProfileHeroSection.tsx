import { UserRound } from "lucide-react";
import type { ECardIconShape, EcardHero, EcardSocialLinksComponent } from "@app-types/ecard";
import { HeroShareButton } from "@features/public-ecard/components/sections/HeroShareButton";
import { HeroContactActions } from "@features/public-ecard/components/sections/HeroContactActions";

interface BannerProfileHeroSectionProps {
  hero: EcardHero;
  endpoint: string;
  canExchangeContact: boolean;
  onExchangeContact: () => void;
  socialLinksComponent?: EcardSocialLinksComponent;
  iconShape?: ECardIconShape;
}

// Same banner as BannerHeroSection, but the circular profile photo overlaps
// the banner's bottom edge.
export function BannerProfileHeroSection({
  hero,
  endpoint,
  canExchangeContact,
  onExchangeContact,
  socialLinksComponent,
  iconShape,
}: BannerProfileHeroSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 pb-6">
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
        </div>

        <div className="flex flex-col items-center text-center px-6">
          <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-base-100 bg-base-200">
            {hero.profilePhotoUrl ? (
              <img
                src={hero.profilePhotoUrl}
                alt={hero.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <UserRound className="h-8 w-8 text-base-content/50" />
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-primary break-words">{hero.name}</h1>
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
