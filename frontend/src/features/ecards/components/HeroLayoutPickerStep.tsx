import { Lock } from "lucide-react";
import {
  ECARD_HERO_LAYOUTS,
  ECARD_HERO_LAYOUT_META,
} from "@features/ecards/config/ecardBuilder.config";
import type { ECardHeroLayout } from "@app-types/ecard";

interface HeroLayoutPickerStepProps {
  value: ECardHeroLayout;
  onChange: (layout: ECardHeroLayout) => void;
  /** Which layouts the current plan allows — DEFAULT is always true. Pass null while
   * the policy is still loading, which renders every layout as available in the
   * meantime rather than flashing every card as locked. */
  availableLayouts: Record<ECardHeroLayout, boolean> | null;
  /** ORG_BADGE has its own, plan-independent requirement — an organisation must be linked. */
  hasOrganisationLinked: boolean;
  error?: string;
}

function LayoutPreview({ layout }: { layout: ECardHeroLayout }) {
  switch (layout) {
    case "DEFAULT":
      return (
        <div className="flex h-16 w-full flex-col items-center justify-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-base-content/15" />
          <div className="h-1.5 w-12 rounded-full bg-base-content/15" />
          <div className="h-1.5 w-8 rounded-full bg-base-content/10" />
        </div>
      );
    case "BANNER":
      return (
        <div className="flex h-16 w-full flex-col gap-1.5">
          <div className="h-8 w-full rounded-md bg-base-content/15" />
          <div className="mx-auto h-1.5 w-12 rounded-full bg-base-content/15" />
          <div className="mx-auto h-1.5 w-8 rounded-full bg-base-content/10" />
        </div>
      );
    case "BANNER_PROFILE":
      return (
        <div className="flex h-16 w-full flex-col items-center">
          <div className="h-8 w-full rounded-md bg-base-content/15" />
          <div className="-mt-3 h-6 w-6 rounded-full border-2 border-base-100 bg-base-content/25" />
          <div className="mt-1 h-1.5 w-12 rounded-full bg-base-content/15" />
        </div>
      );
    case "ORG_BADGE":
      return (
        <div className="flex h-16 w-full flex-col items-center justify-center gap-1.5">
          <div className="relative h-7 w-7">
            <div className="h-7 w-7 rounded-full bg-base-content/15" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-base-100 bg-primary/40" />
          </div>
          <div className="h-1.5 w-12 rounded-full bg-base-content/15" />
          <div className="h-1.5 w-8 rounded-full bg-base-content/10" />
        </div>
      );
  }
}

export default function HeroLayoutPickerStep({
  value,
  onChange,
  availableLayouts,
  hasOrganisationLinked,
  error,
}: HeroLayoutPickerStepProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold text-base-content/70">
        Hero layout
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ECARD_HERO_LAYOUTS.map((layout) => {
          const meta = ECARD_HERO_LAYOUT_META[layout];
          const isPlanBlocked = availableLayouts
            ? !availableLayouts[layout]
            : false;
          const isOrgBlocked = layout === "ORG_BADGE" && !hasOrganisationLinked;
          const isLocked = isPlanBlocked || isOrgBlocked;
          const isSelected = value === layout;

          return (
            <button
              key={layout}
              type="button"
              disabled={isLocked}
              onClick={() => onChange(layout)}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border bg-base-100 px-3 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-base-300 hover:border-primary/50"
              }`}
            >
              {isLocked && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral text-neutral-content">
                  <Lock className="h-3 w-3" />
                </span>
              )}
              <div className="flex w-full items-center justify-center rounded-xl bg-base-200 p-2">
                <LayoutPreview layout={layout} />
              </div>
              <div>
                <p className="text-xs font-semibold text-base-content">
                  {meta.label}
                </p>
                <p className="mt-0.5 text-[10px] text-base-content/50">
                  {isOrgBlocked
                    ? "Link an organisation first"
                    : isPlanBlocked
                      ? "Not included in your plan"
                      : meta.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
