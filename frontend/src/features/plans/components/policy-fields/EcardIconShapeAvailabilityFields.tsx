import type { EcardIconShapeAvailability } from "@app-types/plan";
import {
  ECARD_GATED_ICON_SHAPES,
  ECARD_ICON_SHAPE_LABELS,
} from "@features/plans/config";

interface EcardIconShapeAvailabilityFieldsProps {
  value: EcardIconShapeAvailability[];
  onChange: (value: EcardIconShapeAvailability[]) => void;
}

// CIRCLE is never shown here — it's always available and never a toggle,
// mirroring the backend's ECARD_GATED_ICON_SHAPES.
export default function EcardIconShapeAvailabilityFields({
  value,
  onChange,
}: EcardIconShapeAvailabilityFieldsProps) {
  function toggle(iconShape: (typeof ECARD_GATED_ICON_SHAPES)[number]) {
    onChange(
      value.map((entry) =>
        entry.iconShape === iconShape
          ? { ...entry, isAvailable: !entry.isAvailable }
          : entry,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ECARD_GATED_ICON_SHAPES.map((iconShape) => {
        const entry = value.find((item) => item.iconShape === iconShape);
        const isAvailable = entry?.isAvailable ?? false;
        return (
          <label
            key={iconShape}
            className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2"
          >
            <span className="text-sm font-medium text-base-content">
              {ECARD_ICON_SHAPE_LABELS[iconShape]}
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isAvailable}
              onChange={() => toggle(iconShape)}
              aria-label={`${ECARD_ICON_SHAPE_LABELS[iconShape]} icon shape available`}
            />
          </label>
        );
      })}
    </div>
  );
}
