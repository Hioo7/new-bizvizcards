import { Lock } from "lucide-react";
import {
  ECARD_HERO_ICON_SHAPES,
  ECARD_HERO_ICON_SHAPE_META,
} from "@features/ecards/config/ecardBuilder.config";
import type { ECardIconShape } from "@app-types/ecard";

interface HeroIconShapePickerStepProps {
  value: ECardIconShape;
  onChange: (iconShape: ECardIconShape) => void;
  /** Which icon shapes the current plan allows — CIRCLE is always true. Pass
   * null while the policy is still loading, which renders every shape as
   * available in the meantime rather than flashing every card as locked. */
  availableIconShapes: Record<ECardIconShape, boolean> | null;
  error?: string;
}

export default function HeroIconShapePickerStep({
  value,
  onChange,
  availableIconShapes,
  error,
}: HeroIconShapePickerStepProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold text-base-content/70">
        Social icon shape
      </p>
      <div className="flex justify-between gap-2">
        {ECARD_HERO_ICON_SHAPES.map((iconShape) => {
          const meta = ECARD_HERO_ICON_SHAPE_META[iconShape];
          const isLocked = availableIconShapes
            ? !availableIconShapes[iconShape]
            : false;
          const isSelected = value === iconShape;

          return (
            <button
              key={iconShape}
              type="button"
              disabled={isLocked}
              onClick={() => onChange(iconShape)}
              aria-label={meta.label}
              aria-pressed={isSelected}
              className="relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1.5 py-1 disabled:cursor-not-allowed"
            >
              <div className="relative flex h-11 w-11 items-center justify-center">
                {/* Shape layer only — TEARDROP's rotation must never reach
                    the lock glyph below, so it lives on its own element. */}
                <span
                  className={`absolute inset-0 bg-base-300 transition ${meta.className} ${
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100"
                      : "opacity-70"
                  } ${isLocked ? "opacity-40" : ""}`}
                />
                {isLocked && (
                  <Lock className="relative h-3.5 w-3.5 text-base-content/60" />
                )}
              </div>
              <p className="text-[10px] font-medium text-base-content/60">
                {meta.label}
              </p>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
