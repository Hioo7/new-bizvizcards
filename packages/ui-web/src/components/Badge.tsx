import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "error";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Outline style instead of a solid fill. */
  outline?: boolean;
  /** Small leading icon (e.g. a status dot or check). */
  icon?: ReactNode;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "badge-neutral",
  primary: "badge-primary",
  info: "badge-info",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "badge-sm",
  md: "",
  lg: "badge-lg",
};

/** A short status label. */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  outline = false,
  icon,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "badge gap-1",
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        outline && "badge-outline",
      )}
    >
      {icon ? (
        <span className="flex h-3 w-3 items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </span>
  );
}
