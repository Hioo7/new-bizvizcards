import { useState } from "react";
import type { EcardVideoGalleryComponent, EcardVideoSubGallery } from "@app-types/ecard";
import { getEcardVideoThumbnailUrl } from "@features/ecards";
import { MediaCarousel } from "@features/public-ecard/components/MediaCarousel";
import type { MediaCarouselItem } from "@features/public-ecard/components/MediaCarousel";

interface VideoGallerySectionProps {
  component: EcardVideoGalleryComponent;
}

interface VideoGalleryCarouselItem extends MediaCarouselItem {
  videoUrl: string;
}

function VideoSubGalleryCarousel({
  subGallery,
}: {
  subGallery: EcardVideoSubGallery;
}) {
  const title = subGallery.title ?? "Video gallery";
  const items: VideoGalleryCarouselItem[] = subGallery.videos.map((video, idx) => ({
    id: `${video.videoUrl}-${idx}`,
    thumbnailUrl: getEcardVideoThumbnailUrl(video.videoUrl),
    videoUrl: video.videoUrl,
    caption: video.caption,
  }));

  return (
    <MediaCarousel
      items={items}
      title={title}
      renderMain={(item, idx) => (
        <div
          className="relative w-full overflow-hidden bg-black"
          style={{ paddingTop: "56.25%" }}
        >
          <iframe
            src={item.videoUrl}
            title={`${title} video ${idx + 1}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    />
  );
}

function VideoSubGalleryItem({
  subGallery,
}: {
  subGallery: EcardVideoSubGallery;
}) {
  const [isOpen, setIsOpen] = useState(true);
  if (subGallery.videos.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left font-semibold hover:text-primary transition-colors flex items-center justify-between"
      >
        <span className="min-w-0 truncate text-lg">{subGallery.title || "Video Gallery"}</span>
        <span>{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && <VideoSubGalleryCarousel subGallery={subGallery} />}
    </div>
  );
}

export function VideoGallerySection({ component }: VideoGallerySectionProps) {
  return (
    <>
      {component.subGalleries.map((subGallery) => (
        <VideoSubGalleryItem key={subGallery.id} subGallery={subGallery} />
      ))}
    </>
  );
}
