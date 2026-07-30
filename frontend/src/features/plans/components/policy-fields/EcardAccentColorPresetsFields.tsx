import { Plus, Trash2 } from "lucide-react";
import ColorField from "@components/forms/ColorField";
import type { EcardAccentColorPreset } from "@app-types/plan";
import { ECARD_MAX_ACCENT_COLOR_PRESETS } from "@features/plans/config";

interface EcardAccentColorPresetsFieldsProps {
  value: EcardAccentColorPreset[];
  onChange: (value: EcardAccentColorPreset[]) => void;
}

const DEFAULT_NEW_PRESET: EcardAccentColorPreset = {
  themeAffinity: "DARK",
  primaryColor: "#38bdf8",
  secondaryColor: "#818cf8",
};

export default function EcardAccentColorPresetsFields({
  value,
  onChange,
}: EcardAccentColorPresetsFieldsProps) {
  function updateAt(index: number, patch: Partial<EcardAccentColorPreset>) {
    onChange(
      value.map((preset, i) => (i === index ? { ...preset, ...patch } : preset)),
    );
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addPreset() {
    onChange([...value, { ...DEFAULT_NEW_PRESET }]);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-base-content/50">
        Preset accent-color pairs a customer on this plan can pick without
        needing full custom-color access. An empty list means no presets are
        offered.
      </p>

      {value.map((preset, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-field border border-base-300 bg-base-200 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <select
              value={preset.themeAffinity}
              onChange={(event) =>
                updateAt(index, {
                  themeAffinity: event.target.value as
                    | "DARK"
                    | "LIGHT",
                })
              }
              aria-label="Theme affinity"
              className="min-h-11 rounded-field border border-base-300 bg-base-100 px-3 text-sm text-base-content focus:border-primary focus:outline-none"
            >
              <option value="DARK">Dark themes</option>
              <option value="LIGHT">Light themes</option>
            </select>
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label="Remove preset"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-error hover:bg-error/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              id={`preset-${index}-primary`}
              label="Primary"
              value={preset.primaryColor}
              onChange={(next) => updateAt(index, { primaryColor: next })}
            />
            <ColorField
              id={`preset-${index}-secondary`}
              label="Secondary"
              value={preset.secondaryColor}
              onChange={(next) => updateAt(index, { secondaryColor: next })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPreset}
        disabled={value.length >= ECARD_MAX_ACCENT_COLOR_PRESETS}
        className="flex min-h-11 items-center justify-center gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add preset
      </button>
    </div>
  );
}
