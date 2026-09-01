import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { Toast as GlueToast, ToastDescription } from "./ui/toast";
import { cn } from "../utils/cn";

export type ToastAction = "info" | "success" | "warning" | "error";

export interface ToastProps {
  children: ReactNode;
  action?: ToastAction;
  /** Status icon — toasts always pair an icon with the label. */
  icon?: ReactNode;
  /** Renders a trailing dismiss button when provided. */
  onDismiss?: () => void;
}

const ACTION_GLUE = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
} as const;

/**
 * A single transient status message. Prefer the `useToast()` hook for real use;
 * this component is what it renders.
 */
export function Toast({ children, action = "info", icon, onDismiss }: ToastProps) {
  return (
    <GlueToast action={ACTION_GLUE[action]} variant="solid" className="rounded-field">
      <View className="flex-row items-center gap-2">
        {icon}
        <ToastDescription className={cn("flex-1 text-sm text-typography-0")}>
          {children}
        </ToastDescription>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onDismiss}
            className="h-6 w-6 items-center justify-center"
          >
            <Text className="text-typography-0">✕</Text>
          </Pressable>
        ) : null}
      </View>
    </GlueToast>
  );
}
