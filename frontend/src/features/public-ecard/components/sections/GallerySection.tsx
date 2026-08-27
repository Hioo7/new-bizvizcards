import { useState } from "react";
import type { EcardGalleryComponent, EcardSubGallery } from "@app-types/ecard";
import { MediaCarousel } from "@features/public-ecard/components/MediaCarousel";
import type { MediaCarouselItem } from "@features/public-ecard/components/MediaCarousel";

interface GallerySectionProps {
  component: EcardGalleryComponent;
}

interface GalleryCarouselItem extends MediaCarouselItem {
  imageUrl: string;
}

function SubGalleryCarousel({ subGallery }: { subGallery: EcardSubGallery }) {
  const title = subGallery.title ?? "Gallery";
  const items: GalleryCarouselItem[] = subGallery.images.map((image, idx) => ({
    id: `${image.imageMediaId}-${idx}`,
    thumbnailUrl: image.imageUrl,
    imageUrl: image.imageUrl,
    caption: image.caption,
  }));

  return (
    <MediaCarousel
      items={items}
      title={title}
      renderMain={(item, idx) => (
        <img
          src={item.imageUrl}
          alt={`${title} photo ${idx + 1}`}
          className="w-full h-auto object-contain"
        />
      )}
    />
  );
}

function SubGalleryItem({ subGallery }: { subGallery: EcardSubGallery }) {
  const [isOpen, setIsOpen] = useState(true);
  if (subGallery.images.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left font-semibold hover:text-primary transition-colors flex items-center justify-between"
      >
        <span className="min-w-0 truncate text-lg">{subGallery.title || "Gallery"}</span>
        <span>{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && <SubGalleryCarousel subGallery={subGallery} />}
    </div>
  );
}

export function GallerySection({ component }: GallerySectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {component.subGalleries.map((subGallery) => (
        <SubGalleryItem key={subGallery.id} subGallery={subGallery} />
      ))}
    </div>
  );
}
