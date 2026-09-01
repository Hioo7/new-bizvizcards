import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export type IconButtonVariant = "primary" | "ghost" | "outline" | "error";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  /** Accessible name — required, since there is no visible text. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Circular (default) vs. rounded-square. */
  shape?: "circle" | "square";
  loading?: boolean;
}

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  outline: "btn-outline",
  error: "btn-error",
};

const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: "btn-sm min-h-11 min-w-11",
  md: "",
  lg: "btn-lg",
};

/** An icon-only action. Always pass `label` for screen readers and tooltips. */
export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  shape = "circle",
  loading = false,
  disabled,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(
        "btn",
        shape === "circle" ? "btn-circle" : "btn-square",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
      )}
      {...rest}
    >
      {loading ? <span className="loading loading-spinner loading-sm" /> : icon}
    </button>
  );
}
