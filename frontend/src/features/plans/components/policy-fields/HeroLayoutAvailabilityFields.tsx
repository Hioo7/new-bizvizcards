import type { EcardHeroLayoutAvailability } from "@app-types/plan";
import {
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_HERO_LAYOUT_LABELS,
} from "@features/plans/config";

interface HeroLayoutAvailabilityFieldsProps {
  value: EcardHeroLayoutAvailability[];
  onChange: (value: EcardHeroLayoutAvailability[]) => void;
}

// DEFAULT is never shown here — it's always available and never a toggle,
// mirroring the backend's ECARD_GATED_HERO_LAYOUTS.
export default function HeroLayoutAvailabilityFields({
  value,
  onChange,
}: HeroLayoutAvailabilityFieldsProps) {
  function toggle(layout: (typeof ECARD_GATED_HERO_LAYOUTS)[number]) {
    onChange(
      value.map((entry) =>
        entry.layout === layout
          ? { ...entry, isAvailable: !entry.isAvailable }
          : entry,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ECARD_GATED_HERO_LAYOUTS.map((layout) => {
        const entry = value.find((item) => item.layout === layout);
        const isAvailable = entry?.isAvailable ?? false;
        return (
          <label
            key={layout}
            className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2"
          >
            <span className="text-sm font-medium text-base-content">
              {ECARD_HERO_LAYOUT_LABELS[layout]}
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isAvailable}
              onChange={() => toggle(layout)}
              aria-label={`${ECARD_HERO_LAYOUT_LABELS[layout]} layout available`}
            />
          </label>
        );
      })}
    </div>
  );
}
