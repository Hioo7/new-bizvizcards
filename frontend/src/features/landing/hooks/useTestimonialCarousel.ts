import { useEffect, useState } from "react";
import { TESTIMONIAL_ROTATE_INTERVAL_MS } from "@features/landing/config/content";

export function useTestimonialCarousel(itemCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev === itemCount - 1 ? 0 : prev + 1));
    }, TESTIMONIAL_ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [itemCount]);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? itemCount - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev === itemCount - 1 ? 0 : prev + 1));

  return { currentIndex, goToPrevious, goToNext };
}
