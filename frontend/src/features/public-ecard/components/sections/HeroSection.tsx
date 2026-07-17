import { useState } from "react";
import { Download, Share2, UserRound, UserRoundPlus } from "lucide-react";
import { ecardVCardUrl } from "@services/publicEcardService";
import type { EcardHero } from "@app-types/ecard";

interface HeroSectionProps {
  hero: EcardHero;
  endpoint: string;
  canExchangeContact: boolean;
  onExchangeContact: () => void;
}

export function HeroSection({
  hero,
  endpoint,
  canExchangeContact,
  onExchangeContact,
}: HeroSectionProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: hero.name, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="relative">
        <button
          type="button"
          onClick={() => void handleShare()}
          aria-label="Share this card"
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral/30"
        >
          <Share2 className="h-5 w-5" />
        </button>
        {copied && (
          <span className="absolute right-4 top-14 rounded-full bg-neutral/70 px-3 py-1 text-xs">
            Link copied
          </span>
        )}

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
            <h1 className="text-3xl font-bold text-primary">{hero.name}</h1>
            {hero.companyName && (
              <p className="text-sm text-base-content/70">{hero.companyName}</p>
            )}
          </div>
        </div>
      </div>

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
      </div>
    </div>
  );
}
