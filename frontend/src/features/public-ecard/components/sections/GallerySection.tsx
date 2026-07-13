import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EcardGalleryComponent, EcardSubGallery } from "@app-types/ecard";

interface GallerySectionProps {
  component: EcardGalleryComponent;
}

function SubGalleryCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeLen = Math.max(images.length, 1);
  const hasMultiple = images.length > 1;

  const next = () => setCurrentIndex((prev) => (prev + 1) % safeLen);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + safeLen) % safeLen);

  return (
    <div className="mt-4 space-y-4">
      <div className="relative bg-gray-100 rounded-xl overflow-hidden">
        {images[currentIndex] && (
          <img
            src={images[currentIndex]}
            alt={`${title} photo ${currentIndex + 1}`}
            className="w-full h-auto object-contain"
          />
        )}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {images.map((image, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 h-16 shrink-0 rounded-md border-2 overflow-hidden ${
                currentIndex === idx ? "border-indigo-500" : "border-transparent"
              }`}
            >
              <img
                src={image}
                alt={`${title} thumbnail ${idx + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubGalleryItem({ subGallery }: { subGallery: EcardSubGallery }) {
  const [isOpen, setIsOpen] = useState(true);
  const imageUrls = subGallery.images.map((image) => image.imageUrl);
  if (imageUrls.length === 0) return null;

  return (
    <div className="px-6 py-4 bg-white border-b">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left font-semibold text-gray-700 hover:text-indigo-600 transition-colors flex items-center justify-between"
      >
        <span className="text-lg">{subGallery.title || "Gallery"}</span>
        <span>{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && (
        <SubGalleryCarousel images={imageUrls} title={subGallery.title ?? "Gallery"} />
      )}
    </div>
  );
}

export function GallerySection({ component }: GallerySectionProps) {
  return (
    <>
      {component.subGalleries.map((subGallery) => (
        <SubGalleryItem key={subGallery.id} subGallery={subGallery} />
      ))}
    </>
  );
}
