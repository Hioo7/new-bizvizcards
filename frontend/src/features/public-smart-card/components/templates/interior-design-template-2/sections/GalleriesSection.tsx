import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SmartCardGallery } from "@app-types/smartCard";

interface GalleriesSectionProps {
  galleries: SmartCardGallery[];
}

function GalleryCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeLen = Math.max(images.length, 1);
  const hasMultiple = images.length > 1;

  const next = () => setCurrentIndex((prev) => (prev + 1) % safeLen);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + safeLen) % safeLen);

  return (
    <div className="mt-4 space-y-4">
      <div className="relative bg-gray-100 rounded-xl overflow-hidden">
        {images[currentIndex] && (
          <img src={images[currentIndex]} alt={`${title} Gallery`} className="w-full h-auto object-contain" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      </div>
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`relative w-16 h-16 flex-shrink-0 rounded-md cursor-pointer border-2 overflow-hidden ${currentIndex === idx ? "border-blue-500" : "border-transparent"}`}
            onClick={() => setCurrentIndex(idx)}
          >
            <img src={img} alt={`${title} Thumbnail ${idx}`} className="absolute inset-0 h-full w-full object-cover rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryViewItem({ gallery }: { gallery: { title: string; images: string[] } }) {
  const [showGallery, setShowGallery] = useState(true);

  return (
    <div className="px-6 py-4 bg-white border-b">
      <button
        onClick={() => setShowGallery((prev) => !prev)}
        className="w-full text-left font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center justify-between"
      >
        <span className="text-lg">{gallery.title}</span>
        <span>{showGallery ? "▼" : "▶"}</span>
      </button>
      {showGallery && <GalleryCarousel images={gallery.images} title={gallery.title} />}
    </div>
  );
}

export function GalleriesSection({ galleries }: GalleriesSectionProps) {
  return (
    <>
      {galleries.map((gallery, galleryIndex) => {
        const viewUrls = gallery.images.map((image) => image.imageUrl).filter(Boolean);
        if (viewUrls.length === 0) return null;
        return (
          <GalleryViewItem key={galleryIndex} gallery={{ title: gallery.title ?? "", images: viewUrls }} />
        );
      })}
    </>
  );
}
