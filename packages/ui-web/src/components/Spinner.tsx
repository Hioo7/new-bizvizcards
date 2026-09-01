import { cn } from "../utils/cn";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Screen-reader label; also shown as muted text when `showLabel` is set. */
  label?: string;
  showLabel?: boolean;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: "loading-sm",
  md: "loading-md",
  lg: "loading-lg",
};

/** An indeterminate loading indicator. */
export function Spinner({
  size = "md",
  label = "Loading",
  showLabel = false,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-base-content/60">
      <span
        role="status"
        aria-label={label}
        className={cn("loading loading-spinner text-primary", SIZE_CLASS[size])}
      />
      {showLabel ? <span className="text-xs">{label}</span> : null}
    </div>
  );
}
