import type { VideoGalleryComponentLimits } from "@app-types/plan";

interface VideoGalleryLimitsFieldsProps {
  value: VideoGalleryComponentLimits;
  onChange: (value: VideoGalleryComponentLimits) => void;
}

export default function VideoGalleryLimitsFields({
  value,
  onChange,
}: VideoGalleryLimitsFieldsProps) {
  return (
    <div className="ml-4 grid grid-cols-1 gap-3 border-l-2 border-base-300 pl-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Max video galleries
        </span>
        <input
          type="number"
          min={0}
          value={value.maxVideoGalleries}
          onChange={(event) =>
            onChange({
              ...value,
              maxVideoGalleries: Number(event.target.value),
            })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Max videos / gallery
        </span>
        <input
          type="number"
          min={0}
          value={value.maxVideosPerGallery}
          onChange={(event) =>
            onChange({
              ...value,
              maxVideosPerGallery: Number(event.target.value),
            })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </label>
    </div>
  );
}
