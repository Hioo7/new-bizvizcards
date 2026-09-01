import type { ReactNode } from "react";
import {
  Button as GlueButton,
  ButtonText,
  ButtonSpinner,
} from "./ui/button";
import { cn } from "../utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "error";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  /** Visual weight. `primary` is the single highest-emphasis action per screen. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the container (default for primary mobile CTAs). */
  block?: boolean;
  /** Swap the label for a spinner and disable interaction. */
  isLoading?: boolean;
  isDisabled?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onPress?: () => void;
  children: ReactNode;
}

const ACTION = {
  primary: "primary",
  secondary: "secondary",
  outline: "primary",
  ghost: "default",
  error: "negative",
} as const;

const GLUE_VARIANT = {
  primary: "solid",
  secondary: "solid",
  outline: "outline",
  ghost: "solid",
  error: "solid",
} as const;

const SIZE = { sm: "sm", md: "md", lg: "lg" } as const;

/** The primary tap target. Icon-only actions use `IconButton`. */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  isLoading = false,
  isDisabled = false,
  leadingIcon,
  trailingIcon,
  onPress,
  children,
}: ButtonProps) {
  return (
    <GlueButton
      action={ACTION[variant]}
      variant={GLUE_VARIANT[variant]}
      size={SIZE[size]}
      isDisabled={isDisabled || isLoading}
      onPress={onPress}
      className={cn(
        "rounded-field gap-2",
        block && "w-full",
        size === "sm" && "min-h-[44px]",
      )}
    >
      {isLoading ? <ButtonSpinner /> : leadingIcon}
      <ButtonText
        className={cn(
          variant === "primary" && "text-typography-0",
          variant === "error" && "text-typography-0",
          variant === "secondary" && "text-typography-0",
        )}
      >
        {children}
      </ButtonText>
      {!isLoading ? trailingIcon : null}
    </GlueButton>
  );
}
