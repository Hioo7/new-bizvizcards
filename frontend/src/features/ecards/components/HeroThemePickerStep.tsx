import { Lock } from "lucide-react";
import {
  ECARD_HERO_THEMES,
  ECARD_HERO_THEME_META,
} from "@features/ecards/config/ecardBuilder.config";
import type { ECardTheme } from "@app-types/ecard";

interface HeroThemePickerStepProps {
  value: ECardTheme;
  onChange: (theme: ECardTheme) => void;
  /** Which themes the current plan allows — DEFAULT_DARK is always true. Pass
   * null while the policy is still loading, which renders every theme as
   * available in the meantime rather than flashing every card as locked. */
  availableThemes: Record<ECardTheme, boolean> | null;
  error?: string;
}

export default function HeroThemePickerStep({
  value,
  onChange,
  availableThemes,
  error,
}: HeroThemePickerStepProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold text-base-content/70">Theme</p>
      <div className="grid grid-cols-3 gap-3">
        {ECARD_HERO_THEMES.map((theme) => {
          const meta = ECARD_HERO_THEME_META[theme];
          const isLocked = availableThemes ? !availableThemes[theme] : false;
          const isSelected = value === theme;

          return (
            <button
              key={theme}
              type="button"
              disabled={isLocked}
              onClick={() => onChange(theme)}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border bg-base-100 px-2 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-base-300 hover:border-primary/50"
              }`}
            >
              <div
                className="relative h-12 w-full overflow-hidden rounded-xl"
                style={{
                  background: `linear-gradient(to right, ${meta.gradient.from}, ${meta.gradient.via}, ${meta.gradient.to})`,
                }}
              >
                <span
                  className="absolute bottom-1.5 left-1.5 h-3 w-3 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: meta.accent }}
                />
              </div>
              {isLocked && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral text-neutral-content">
                  <Lock className="h-3 w-3" />
                </span>
              )}
              <p className="text-xs font-semibold text-base-content">
                {meta.label}
              </p>
              {isLocked && (
                <p className="text-[10px] text-base-content/50">
                  Not included in your plan
                </p>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
