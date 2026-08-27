import { Download, UserRoundPlus } from "lucide-react";
import { ecardVCardUrl } from "@services/publicEcardService";
import { SocialLinksSection } from "@features/public-ecard/components/sections/SocialLinksSection";
import type { ECardIconShape, EcardSocialLinksComponent } from "@app-types/ecard";

interface HeroContactActionsProps {
  endpoint: string;
  canExchangeContact: boolean;
  onExchangeContact: () => void;
  socialLinksComponent?: EcardSocialLinksComponent;
  iconShape?: ECardIconShape;
}

// Extracted from the Default Hero layout — the "Exchange contact" /
// "Save contact" buttons are identical across every layout variant.
export function HeroContactActions({
  endpoint,
  canExchangeContact,
  onExchangeContact,
  socialLinksComponent,
  iconShape,
}: HeroContactActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {canExchangeContact && (
        <button
          type="button"
          onClick={onExchangeContact}
          className="flex h-26 w-full items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-200 shadow-xl"
        >
          <UserRoundPlus className="h-5 w-5" />
          <h2 className="text-2xl font-bold">
            Exchange <span className="text-primary">contact</span>
          </h2>
        </button>
      )}
      <a
        href={ecardVCardUrl(endpoint)}
        className="flex h-26 w-full items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-200 shadow-xl"
      >
        <Download className="h-5 w-5" />
        <h2 className="text-2xl font-bold">
          Save <span className="text-primary">contact</span>
        </h2>
      </a>
      {socialLinksComponent && iconShape && (
        <div className="hidden md:block">
          <SocialLinksSection component={socialLinksComponent} iconShape={iconShape} />
        </div>
      )}
    </div>
  );
}
