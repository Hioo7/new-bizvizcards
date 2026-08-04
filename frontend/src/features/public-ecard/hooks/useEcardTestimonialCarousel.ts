import { useEffect, useRef, useState } from "react";
import { ECARD_TESTIMONIAL_ROTATE_INTERVAL_MS } from "@features/public-ecard/config/ecardPreview.config";

/** Auto-advancing carousel index, synced onto a CSS scroll-snap container via
 * `scrollRef` — a manual swipe temporarily nudges the scroll position, but
 * the next auto-advance tick always scrolls back in line with `currentIndex`,
 * the simplest correct reconciliation (no attempt to read swipes back into
 * state). Mirrors `useTestimonialCarousel` (landing page), scoped to ecards
 * so it isn't a cross-feature import into marketing-page config. */
export function useEcardTestimonialCarousel(itemCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemCount <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev === itemCount - 1 ? 0 : prev + 1));
    }, ECARD_TESTIMONIAL_ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [itemCount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[currentIndex] as HTMLElement | undefined;
    if (!card) return;
    // Scroll only the carousel's own horizontal container — never
    // `card.scrollIntoView()`, which walks every scrollable ancestor
    // (including the page itself) and yanks the whole page's vertical
    // scroll back to this section on every auto-advance tick.
    container.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  }, [currentIndex]);

  return { currentIndex, goToIndex: setCurrentIndex, scrollRef };
}
