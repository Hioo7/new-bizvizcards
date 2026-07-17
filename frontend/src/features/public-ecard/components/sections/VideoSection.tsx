import type { EcardVideoComponent } from "@app-types/ecard";

interface VideoSectionProps {
  component: EcardVideoComponent;
}

export function VideoSection({ component }: VideoSectionProps) {
  if (!component.videoUrl) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      {component.title && (
        <h3 className="mb-3 text-xl font-semibold">{component.title}</h3>
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
