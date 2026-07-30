import type { EcardThemeAvailability } from "@app-types/plan";
import { ECARD_GATED_THEMES, ECARD_THEME_LABELS } from "@features/plans/config";

interface EcardThemeAvailabilityFieldsProps {
  value: EcardThemeAvailability[];
  onChange: (value: EcardThemeAvailability[]) => void;
}

// DEFAULT_DARK is never shown here — it's always available and never a
// toggle, mirroring the backend's ECARD_GATED_THEMES.
export default function EcardThemeAvailabilityFields({
  value,
  onChange,
}: EcardThemeAvailabilityFieldsProps) {
  function toggle(theme: (typeof ECARD_GATED_THEMES)[number]) {
    onChange(
      value.map((entry) =>
        entry.theme === theme
          ? { ...entry, isAvailable: !entry.isAvailable }
          : entry,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ECARD_GATED_THEMES.map((theme) => {
        const entry = value.find((item) => item.theme === theme);
        const isAvailable = entry?.isAvailable ?? false;
        return (
          <label
            key={theme}
            className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2"
          >
            <span className="text-sm font-medium text-base-content">
              {ECARD_THEME_LABELS[theme]}
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isAvailable}
              onChange={() => toggle(theme)}
              aria-label={`${ECARD_THEME_LABELS[theme]} theme available`}
            />
          </label>
        );
      })}
    </div>
  );
}
