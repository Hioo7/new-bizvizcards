import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "error";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** Visual weight. `primary` is the single highest-emphasis action per screen. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the container (default for primary mobile CTAs). */
  block?: boolean;
  /** Swap the label for a spinner and disable interaction. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  outline: "btn-outline",
  error: "btn-error",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm min-h-11",
  md: "",
  lg: "btn-lg",
};

/**
 * The primary tap target. Icon-only actions use `IconButton` instead; this one
 * always carries a text label.
 */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(
        "btn gap-2",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        block && "btn-block",
      )}
      {...rest}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}
