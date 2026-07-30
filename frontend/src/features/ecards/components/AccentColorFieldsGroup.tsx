import { useState } from "react";
import { Check, Lock, Palette } from "lucide-react";
import ColorField from "@components/forms/ColorField";
import type { ECardTheme } from "@app-types/ecard";
import type { EcardAccentColorPreset } from "@app-types/plan";

interface OrganisationAccentColorLock {
  primaryAccentColor: string | null;
  secondaryAccentColor: string | null;
}

interface AccentColorFieldsGroupProps {
  primaryAccentColor: string | null;
  secondaryAccentColor: string | null;
  onChange: (primary: string | null, secondary: string | null) => void;
  theme: ECardTheme;
  presets: EcardAccentColorPreset[];
  customizationAvailable: boolean;
  /** When set, the linked organisation's template locks one or both colors —
   * those fields render read-only regardless of the customer's own plan. */
  organisationLock?: OrganisationAccentColorLock | null;
}

const THEME_AFFINITY: Record<ECardTheme, EcardAccentColorPreset["themeAffinity"]> = {
  DEFAULT_DARK: "DARK",
  NAVY_TEAL: "DARK",
  LIGHT: "LIGHT",
};

function isSamePair(
  a: { primary: string | null; secondary: string | null },
  b: { primaryColor: string | null; secondaryColor: string | null },
): boolean {
  return a.primary === b.primaryColor && a.secondary === b.secondaryColor;
}

export default function AccentColorFieldsGroup({
  primaryAccentColor,
  secondaryAccentColor,
  onChange,
  theme,
  presets,
  customizationAvailable,
  organisationLock,
}: AccentColorFieldsGroupProps) {
  const relevantPresets = presets.filter(
    (preset) => preset.themeAffinity === THEME_AFFINITY[theme],
  );
  const matchesThemeDefault =
    primaryAccentColor === null && secondaryAccentColor === null;
  const matchesAnyPreset = relevantPresets.some((preset) =>
    isSamePair(
      { primary: primaryAccentColor, secondary: secondaryAccentColor },
      preset,
    ),
  );
  const [isCustomOpen, setIsCustomOpen] = useState(
    customizationAvailable && !matchesThemeDefault && !matchesAnyPreset,
  );

  const primaryLocked = Boolean(organisationLock?.primaryAccentColor);
  const secondaryLocked = Boolean(organisationLock?.secondaryAccentColor);

  // A partial lock (only one of the two colors forced) still lets the member
  // customize whichever color isn't locked — presets don't apply cleanly
  // once one color is already fixed, so this shows two plain fields instead.
  if (primaryLocked || secondaryLocked) {
    return (
      <div>
        <p className="mb-3 text-xs font-semibold text-base-content/70">
          Accent colors
        </p>
        <div className="space-y-3">
          <ColorField
            id="primaryAccentColor"
            label="Primary accent"
            value={
              organisationLock?.primaryAccentColor ??
              primaryAccentColor ??
              "#ffffff"
            }
            onChange={(next) => onChange(next, secondaryAccentColor)}
            disabled={primaryLocked}
            disabledReason={
              primaryLocked ? "Locked by your organisation" : undefined
            }
          />
          <ColorField
            id="secondaryAccentColor"
            label="Secondary accent"
            value={
              organisationLock?.secondaryAccentColor ??
              secondaryAccentColor ??
              "#ffffff"
            }
            onChange={(next) => onChange(primaryAccentColor, next)}
            disabled={secondaryLocked}
            disabledReason={
              secondaryLocked ? "Locked by your organisation" : undefined
            }
          />
        </div>
      </div>
    );
  }

  if (relevantPresets.length === 0 && !customizationAvailable) {
    return (
      <div>
        <p className="mb-3 text-xs font-semibold text-base-content/70">
          Accent colors
        </p>
        <div className="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-base-content/40" />
          <p className="text-xs text-base-content/60">
            Your plan doesn&rsquo;t include custom accent colors — your
            card uses the theme&rsquo;s own colors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold text-base-content/70">
        Accent colors
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setIsCustomOpen(false);
            onChange(null, null);
          }}
          aria-label="Use theme default accent colors"
          aria-pressed={matchesThemeDefault && !isCustomOpen}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1"
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed bg-base-200 transition ${
              matchesThemeDefault && !isCustomOpen
                ? "border-primary ring-2 ring-primary/30"
                : "border-base-300"
            }`}
          >
            {matchesThemeDefault && !isCustomOpen && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </span>
          <span className="text-[10px] font-medium text-base-content/60">
            Theme
          </span>
        </button>

        {relevantPresets.map((preset) => {
          const isSelected =
            !isCustomOpen &&
            isSamePair(
              { primary: primaryAccentColor, secondary: secondaryAccentColor },
              preset,
            );
          return (
            <button
              key={`${preset.primaryColor}-${preset.secondaryColor}`}
              type="button"
              onClick={() => {
                setIsCustomOpen(false);
                onChange(preset.primaryColor, preset.secondaryColor);
              }}
              aria-label={`Preset accent colors ${preset.primaryColor} and ${preset.secondaryColor}`}
              aria-pressed={isSelected}
              className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1"
            >
              <span
                className={`relative h-11 w-11 overflow-hidden rounded-full border transition ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-base-300"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${preset.primaryColor} 50%, ${preset.secondaryColor} 50%)`,
                }}
              >
                {isSelected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                )}
              </span>
            </button>
          );
        })}

        {customizationAvailable && (
          <button
            type="button"
            onClick={() => setIsCustomOpen(true)}
            aria-label="Use custom accent colors"
            aria-pressed={isCustomOpen}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed bg-base-200 transition ${
                isCustomOpen
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-base-300"
              }`}
            >
              <Palette className="h-4 w-4 text-base-content/50" />
            </span>
            <span className="text-[10px] font-medium text-base-content/60">
              Custom
            </span>
          </button>
        )}
      </div>

      {isCustomOpen && customizationAvailable && (
        <div className="mt-4 space-y-3">
          <ColorField
            id="primaryAccentColor"
            label="Primary accent"
            value={primaryAccentColor ?? "#ffffff"}
            onChange={(next) => onChange(next, secondaryAccentColor)}
            disabled={primaryLocked}
            disabledReason={primaryLocked ? "Locked by your organisation" : undefined}
          />
          <ColorField
            id="secondaryAccentColor"
            label="Secondary accent"
            value={secondaryAccentColor ?? "#ffffff"}
            onChange={(next) => onChange(primaryAccentColor, next)}
            disabled={secondaryLocked}
            disabledReason={secondaryLocked ? "Locked by your organisation" : undefined}
          />
        </div>
      )}
    </div>
  );
}
