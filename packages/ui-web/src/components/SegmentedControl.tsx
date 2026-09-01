import { cn } from "../utils/cn";

export interface SegmentedOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Stretch each segment to equal width. */
  block?: boolean;
  "aria-label"?: string;
}

/**
 * Compact pill toggle for switching between a small set of mutually exclusive
 * views (e.g. a lead-list filter). Use `Tabs` for section navigation instead.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  block = false,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex gap-1 rounded-field bg-base-200 p-1",
        block && "flex w-full",
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-9 rounded-[calc(var(--radius-field)-0.25rem)] px-3 text-sm font-medium transition-colors",
              block && "flex-1",
              selected
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/60 hover:text-base-content",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
