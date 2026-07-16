import type { EcardComponentAvailability } from "@app-types/plan";
import {
  DEFAULT_GALLERY_LIMITS,
  ECARD_COMPONENT_LABELS,
  ECARD_COMPONENT_TYPES,
} from "@features/plans/config";
import GalleryLimitsFields from "@features/plans/components/policy-fields/GalleryLimitsFields";

interface EcardComponentAvailabilityFieldsProps {
  value: EcardComponentAvailability[];
  onChange: (value: EcardComponentAvailability[]) => void;
}

export default function EcardComponentAvailabilityFields({
  value,
  onChange,
}: EcardComponentAvailabilityFieldsProps) {
  function toggle(type: (typeof ECARD_COMPONENT_TYPES)[number]) {
    onChange(
      value.map((component) =>
        component.type === type
          ? {
              ...component,
              isAvailable: !component.isAvailable,
              ...(type === "GALLERY" &&
                !component.galleryLimits && {
                  galleryLimits: DEFAULT_GALLERY_LIMITS,
                }),
            }
          : component,
      ),
    );
  }

  function updateGalleryLimits(
    type: (typeof ECARD_COMPONENT_TYPES)[number],
    galleryLimits: EcardComponentAvailability["galleryLimits"],
  ) {
    onChange(
      value.map((component) =>
        component.type === type ? { ...component, galleryLimits } : component,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ECARD_COMPONENT_TYPES.map((type) => {
        const component = value.find((entry) => entry.type === type);
        const isAvailable = component?.isAvailable ?? false;
        return (
          <div key={type} className="flex flex-col gap-2">
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
              <span className="text-sm font-medium text-base-content">
                {ECARD_COMPONENT_LABELS[type]}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isAvailable}
                onChange={() => toggle(type)}
                aria-label={`${ECARD_COMPONENT_LABELS[type]} available`}
              />
            </label>
            {type === "GALLERY" && isAvailable && component?.galleryLimits && (
              <GalleryLimitsFields
                value={component.galleryLimits}
                onChange={(limits) => updateGalleryLimits(type, limits)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
