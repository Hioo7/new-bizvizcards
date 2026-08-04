import { ChevronLeft, ChevronRight, CircleUserRound, Star } from "lucide-react";
import { useEcardTestimonialCarousel } from "@features/public-ecard/hooks/useEcardTestimonialCarousel";
import type { EcardTestimonialsComponent } from "@app-types/ecard";

interface TestimonialsSectionProps {
  component: EcardTestimonialsComponent;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? "fill-primary text-primary" : "text-base-content/20"
          }`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection({ component }: TestimonialsSectionProps) {
  const entries = component.entries;
  const { currentIndex, goToIndex, scrollRef } = useEcardTestimonialCarousel(entries.length);

  if (entries.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">What People Say</h2>
        {entries.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={() => goToIndex(currentIndex === 0 ? entries.length - 1 : currentIndex - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-base-content/50 hover:bg-base-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={() => goToIndex(currentIndex === entries.length - 1 ? 0 : currentIndex + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-base-content/50 hover:bg-base-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="w-full shrink-0 snap-center rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/50">
                <CircleUserRound className="h-5 w-5" />
              </div>
              <p className="min-w-0 truncate text-sm font-semibold text-primary">
                {entry.name}
              </p>
            </div>
            <div className="mt-2">
              <StarRow rating={entry.rating} />
            </div>
            <p className="mt-2 text-sm italic break-words">&ldquo;{entry.text}&rdquo;</p>
          </div>
        ))}
      </div>

      {entries.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {entries.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              aria-label={`Go to testimonial ${index + 1}`}
              onClick={() => goToIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-base-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
