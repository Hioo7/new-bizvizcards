import { Star } from "lucide-react";
import type { EcardReviewLinkComponent } from "@app-types/ecard";

interface ReviewLinkSectionProps {
  component: EcardReviewLinkComponent;
}

export function ReviewLinkSection({ component }: ReviewLinkSectionProps) {
  if (!component.url) return null;

  return (
    <a
      href={component.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-26 w-full items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-200 shadow-xl"
    >
      <Star className="h-5 w-5" />
      <h2 className="text-2xl font-bold">
        Leave a <span className="text-primary">review</span>
      </h2>
    </a>
  );
}
