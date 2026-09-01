import type { ReactNode } from "react";
import { Button as GlueButton, ButtonSpinner } from "./ui/button";
import { cn } from "../utils/cn";

export type IconButtonVariant = "primary" | "ghost" | "outline" | "error";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps {
  /** Accessible name — required, since there is no visible text. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Circular (default) vs. rounded-square. */
  shape?: "circle" | "square";
  isLoading?: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
}

const ACTION = {
  primary: "primary",
  ghost: "default",
  outline: "primary",
  error: "negative",
} as const;

const GLUE_VARIANT = {
  primary: "solid",
  ghost: "solid",
  outline: "outline",
  error: "solid",
} as const;

const BOX: Record<IconButtonSize, string> = {
  sm: "h-11 w-11",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

/** An icon-only action. Always pass `label` for screen readers. */
export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  shape = "circle",
  isLoading = false,
  isDisabled = false,
  onPress,
}: IconButtonProps) {
  return (
    <GlueButton
      accessibilityLabel={label}
      action={ACTION[variant]}
      variant={GLUE_VARIANT[variant]}
      isDisabled={isDisabled || isLoading}
      onPress={onPress}
      className={cn(
        "items-center justify-center p-0",
        BOX[size],
        shape === "circle" ? "rounded-full" : "rounded-field",
      )}
    >
      {isLoading ? <ButtonSpinner /> : icon}
    </GlueButton>
  );
}
