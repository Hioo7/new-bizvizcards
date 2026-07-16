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
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-8 text-white text-center">
      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label="Share this card"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25"
      >
        <Share2 className="h-4 w-4" />
      </button>
      {copied && (
        <span className="absolute right-4 top-14 rounded-full bg-black/70 px-3 py-1 text-xs">
          Link copied
        </span>
      )}

      <div className="relative w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden border-2 border-white/30 shadow-lg">
        {hero.profilePhotoUrl ? (
          <img
            src={hero.profilePhotoUrl}
            alt={hero.name}
            className="absolute inset-0 h-full w-full object-cover rounded-full"
          />
        ) : (
          <UserRound className="h-10 w-10 text-white/70" />
        )}
      </div>

      <h1 className="text-3xl font-bold mb-1">{hero.name}</h1>
      {hero.companyName && (
        <p className="text-blue-100 text-sm font-medium tracking-wide opacity-90">
          {hero.companyName}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {canExchangeContact && (
          <button
            type="button"
            onClick={onExchangeContact}
            className="bg-white text-indigo-700 rounded-xl py-3 px-4 font-semibold transition hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <UserRoundPlus className="w-4 h-4" />
            Exchange
          </button>
        )}
        <a
          href={ecardVCardUrl(endpoint)}
          className={`rounded-xl py-3 px-4 font-semibold transition border-2 border-white/70 text-white hover:bg-white/10 flex items-center justify-center gap-2 ${
            canExchangeContact ? "" : "col-span-2"
          }`}
        >
          <Download className="w-4 h-4" />
          Save Contact
        </a>
      </div>
    </div>
  );
}
