import { UserRound } from "lucide-react";
import type { ECardIconShape, EcardHero, EcardSocialLinksComponent } from "@app-types/ecard";
import { HeroShareButton } from "@features/public-ecard/components/sections/HeroShareButton";
import { HeroContactActions } from "@features/public-ecard/components/sections/HeroContactActions";

interface HeroSectionProps {
  hero: EcardHero;
  endpoint: string;
  canExchangeContact: boolean;
  onExchangeContact: () => void;
  socialLinksComponent?: EcardSocialLinksComponent;
  iconShape?: ECardIconShape;
}

export function HeroSection({
  hero,
  endpoint,
  canExchangeContact,
  onExchangeContact,
  socialLinksComponent,
  iconShape,
}: HeroSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="relative">
        <HeroShareButton title={hero.name} />

        <div className="h-full w-full rounded-2xl border border-base-300 bg-base-100 p-8 text-center md:flex md:items-center md:text-left">
          <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-full bg-base-200 md:mx-0">
            {hero.profilePhotoUrl ? (
              <img
                src={hero.profilePhotoUrl}
                alt={hero.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <UserRound className="h-10 w-10 text-base-content/50" />
              </span>
            )}
          </div>

          <div className="mt-6 space-y-1 md:ml-8 md:mt-0">
            <h1 className="text-3xl font-bold text-primary break-words">{hero.name}</h1>
            {hero.companyName && (
              <p className="text-sm text-base-content/70 break-words">{hero.companyName}</p>
            )}
          </div>
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
