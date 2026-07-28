import { useState } from "react";
import { Share2 } from "lucide-react";

interface HeroShareButtonProps {
  title: string;
}

// Extracted from the Default Hero layout so every layout variant gets the
// same share affordance without duplicating the Web Share API / clipboard
// fallback logic.
export function HeroShareButton({ title }: HeroShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
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
    <>
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
    </>
  );
}
