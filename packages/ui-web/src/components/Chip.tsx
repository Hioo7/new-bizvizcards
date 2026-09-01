import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface ChipProps {
  label: string;
  /** Selected (filled) vs. unselected (outlined). */
  selected?: boolean;
  /** Makes the chip a toggle button. */
  onClick?: () => void;
  /** Small leading icon. */
  icon?: ReactNode;
  /** When set, renders a trailing "×" that calls this instead of toggling. */
  onRemove?: () => void;
}

/** A filter / choice chip. Use in a horizontally scrolling row. */
export function Chip({ label, selected = false, onClick, icon, onRemove }: ChipProps) {
  const className = cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-content"
      : "border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30",
  );

  const content = (
    <>
      {icon ? (
        <span className="flex h-3.5 w-3.5 items-center justify-center">
          {icon}
        </span>
      ) : null}
      {label}
      {onRemove ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }
          }}
          className="-mr-1 flex h-4 w-4 items-center justify-center rounded-full opacity-70 hover:opacity-100"
        >
          <span aria-hidden="true">×</span>
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={className}
      >
        {content}
      </button>
    );
  }
  return <span className={className}>{content}</span>;
}
