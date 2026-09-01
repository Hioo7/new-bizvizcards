import type { ReactNode } from "react";
import { View, Text } from "react-native";
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
  /** Small leading icon. */
  icon?: ReactNode;
}

const SOLID: Record<BadgeTone, string> = {
  neutral: "bg-background-100",
  primary: "bg-primary-500",
  info: "bg-info-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};
const SOLID_TEXT: Record<BadgeTone, string> = {
  neutral: "text-typography-700",
  primary: "text-typography-0",
  info: "text-typography-0",
  success: "text-typography-0",
  warning: "text-typography-950",
  error: "text-typography-0",
};
const OUTLINE: Record<BadgeTone, string> = {
  neutral: "border-background-300",
  primary: "border-primary-400",
  info: "border-info-400",
  success: "border-success-400",
  warning: "border-warning-400",
  error: "border-error-400",
};
const OUTLINE_TEXT: Record<BadgeTone, string> = {
  neutral: "text-typography-700",
  primary: "text-primary-600",
  info: "text-info-600",
  success: "text-success-600",
  warning: "text-warning-600",
  error: "text-error-600",
};
const PAD: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5",
  md: "px-2 py-1",
  lg: "px-2.5 py-1.5",
};
const TEXT_SIZE: Record<BadgeSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
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
    <View
      className={cn(
        "flex-row items-center gap-1 self-start rounded-full",
        PAD[size],
        outline ? cn("border bg-transparent", OUTLINE[tone]) : SOLID[tone],
      )}
    >
      {icon}
      <Text
        className={cn(
          "font-medium",
          TEXT_SIZE[size],
          outline ? OUTLINE_TEXT[tone] : SOLID_TEXT[tone],
        )}
      >
        {children}
      </Text>
    </View>
  );
}
