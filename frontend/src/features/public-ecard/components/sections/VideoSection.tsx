import type { EcardVideoComponent } from "@app-types/ecard";

interface VideoSectionProps {
  component: EcardVideoComponent;
}

export function VideoSection({ component }: VideoSectionProps) {
  if (!component.videoUrl) return null;

  return (
    <div className="px-6 py-6 bg-white border-b">
      {component.title && (
        <h3 className="font-semibold text-gray-800 mb-3 text-xl">{component.title}</h3>
      )}
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={component.videoUrl}
          title={component.title ?? "Video"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
