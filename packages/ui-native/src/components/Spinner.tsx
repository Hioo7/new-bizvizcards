import { View, Text } from "react-native";
import { Spinner as GlueSpinner } from "./ui/spinner";
import { colors } from "@bizvizcards/tokens";
import { cn } from "../utils/cn";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Screen-reader label; also shown as muted text below when `showLabel`. */
  label?: string;
  showLabel?: boolean;
}

const RN_SIZE = { sm: "small", md: "small", lg: "large" } as const;

/** Indeterminate loading indicator. */
export function Spinner({ size = "md", label = "Loading", showLabel = false }: SpinnerProps) {
  return (
    <View className="items-center gap-2">
      <GlueSpinner size={RN_SIZE[size]} color={colors.primary} aria-label={label} />
      {showLabel ? (
        <Text className={cn("text-xs text-typography-500")}>{label}</Text>
      ) : null}
    </View>
  );
}
