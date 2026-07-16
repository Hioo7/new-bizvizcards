import type { GalleryComponentLimits } from "@app-types/plan";

interface GalleryLimitsFieldsProps {
  value: GalleryComponentLimits;
  onChange: (value: GalleryComponentLimits) => void;
}

export default function GalleryLimitsFields({
  value,
  onChange,
}: GalleryLimitsFieldsProps) {
  const maxSizeMb = Math.round(value.maxGallerySizeBytes / (1024 * 1024));

  return (
    <div className="ml-4 grid grid-cols-1 gap-3 border-l-2 border-base-300 pl-4 sm:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Max galleries
        </span>
        <input
          type="number"
          min={0}
          value={value.maxGalleries}
          onChange={(event) =>
            onChange({ ...value, maxGalleries: Number(event.target.value) })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Max images / gallery
        </span>
        <input
          type="number"
          min={0}
          value={value.maxImagesPerGallery}
          onChange={(event) =>
            onChange({
              ...value,
              maxImagesPerGallery: Number(event.target.value),
            })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Max gallery size (MB)
        </span>
        <input
          type="number"
          min={0}
          value={maxSizeMb}
          onChange={(event) =>
            onChange({
              ...value,
              maxGallerySizeBytes: Number(event.target.value) * 1024 * 1024,
            })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </label>
    </div>
  );
}
