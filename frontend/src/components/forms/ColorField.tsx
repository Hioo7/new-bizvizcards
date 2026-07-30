import { useState } from "react";
import { Lock, Palette } from "lucide-react";
import { HEX_COLOR_REGEX } from "@config/color.config";

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** When true, the field renders read-only with a lock icon instead of the
   * palette icon — used both for plan-gated and organisation-locked states. */
  disabled?: boolean;
  /** Shown in place of the error line when disabled (e.g. "Not included in
   * your plan" or "Locked by your organisation"). */
  disabledReason?: string;
}

// Free-form color picker (native swatch + synced hex text) — a deliberate,
// narrow exception to the theme-only color rule: fallback colors are
// customer *content* (part of their rendered card), not app chrome.
export default function ColorField({
  id,
  label,
  value,
  onChange,
  error,
  disabled = false,
  disabledReason,
}: ColorFieldProps) {
  const [draft, setDraft] = useState(value);

  function commit(next: string) {
    setDraft(next);
    if (HEX_COLOR_REGEX.test(next)) onChange(next);
  }

  const swatchValue = HEX_COLOR_REGEX.test(draft) ? draft : "#ffffff";

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          value={draft}
          disabled={disabled}
          onChange={(event) => commit(event.target.value)}
          className={`peer w-full rounded-field border bg-base-200 pt-5 pb-2.5 pl-10 pr-12 text-sm text-base-content transition focus:bg-base-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-error focus:border-error"
              : "border-base-300 focus:border-primary"
          }`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-10 top-1.5 text-[10px] font-semibold text-base-content transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-base-content/40 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-primary"
        >
          {label}
        </label>
        {disabled ? (
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        ) : (
          <Palette className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        )}
        <label
          aria-label={`${label} swatch`}
          className={`absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 overflow-hidden rounded-full border border-base-300 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          style={{ backgroundColor: swatchValue }}
        >
          <input
            type="color"
            value={swatchValue}
            disabled={disabled}
            onChange={(event) => commit(event.target.value)}
            className="h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </label>
      </div>
      {disabled && disabledReason ? (
        <p className="mt-1.5 text-xs text-base-content/50">
          {disabledReason}
        </p>
      ) : (
        error && <p className="mt-1.5 text-xs text-error">{error}</p>
      )}
    </div>
  );
}
