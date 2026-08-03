import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";

export interface MediaCarouselItem {
  id: string;
  // null → thumbnail strip falls back to a generic placeholder icon (e.g.
  // Vimeo videos, which have no predictable thumbnail URL without an API call).
  thumbnailUrl: string | null;
  thumbnailAlt?: string;
  caption?: string | null;
}

interface MediaCarouselProps<T extends MediaCarouselItem> {
  items: T[];
  title: string;
  // The only render-prop — everything else (index state, chevrons, dot
  // indicators, thumbnail strip, caption line) is generic.
  renderMain: (item: T, index: number) => ReactNode;
}

export function MediaCarousel<T extends MediaCarouselItem>({
  items,
  title,
  renderMain,
}: MediaCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeLen = Math.max(items.length, 1);
  const hasMultiple = items.length > 1;
  const current = items[currentIndex];

  const next = () => setCurrentIndex((prev) => (prev + 1) % safeLen);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + safeLen) % safeLen);

  if (!current) return null;

  return (
    <div className="mt-4 space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-base-200">
        {renderMain(current, currentIndex)}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={`Previous ${title}`}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-base-100/80 p-2 hover:bg-base-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={`Next ${title}`}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-base-100/80 p-2 hover:bg-base-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "bg-base-content" : "bg-base-content/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {current.caption && (
        <p className="text-sm text-base-content/70">{current.caption}</p>
      )}

      {items.length > 1 && (
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {items.map((item, idx) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`${title} ${idx + 1}`}
              className={`relative w-16 h-16 shrink-0 rounded-md border-2 overflow-hidden bg-base-300 ${
                currentIndex === idx ? "border-primary" : "border-transparent"
              }`}
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.thumbnailAlt ?? `${title} thumbnail ${idx + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-base-content/40">
                  <Video className="h-6 w-6" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
