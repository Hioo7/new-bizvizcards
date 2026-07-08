import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TESTIMONIALS } from "@features/landing/config/content";
import { useTestimonialCarousel } from "@features/landing/hooks/useTestimonialCarousel";

export default function TestimonialsSection() {
  const { currentIndex, goToPrevious, goToNext } = useTestimonialCarousel(
    TESTIMONIALS.length,
  );
  const testimonial = TESTIMONIALS[currentIndex];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-base-content">
            Testimonials
          </h2>
          <p className="text-base-content/60">
            What our customers think about us!
          </p>
        </motion.div>
        <div className="relative mx-auto max-w-2xl">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-box border border-base-300 bg-base-100 p-8 text-center shadow-sm"
          >
            <div className="mb-6 flex justify-center gap-1">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-warning text-warning"
                />
              ))}
            </div>
            <p className="mb-8 text-base leading-relaxed text-base-content/80">
              {testimonial.text}
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-primary/20">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-base-content">
                  {testimonial.name}
                </p>
                <p className="text-xs text-base-content/60">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-6 -translate-y-1/2 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow-sm transition-colors hover:bg-base-200"
          >
            <ChevronLeft className="h-5 w-5 text-base-content/70" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 translate-x-6 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow-sm transition-colors hover:bg-base-200"
          >
            <ChevronRight className="h-5 w-5 text-base-content/70" />
          </button>
        </div>
      </div>
    </section>
  );
}
