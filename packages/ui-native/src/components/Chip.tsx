import type { ReactNode } from "react";
import { Text, Pressable, View } from "react-native";
import { cn } from "../utils/cn";

export interface ChipProps {
  label: string;
  /** Selected (filled) vs. unselected (outlined). */
  selected?: boolean;
  /** Makes the chip a toggle button. */
  onPress?: () => void;
  /** Small leading icon. */
  icon?: ReactNode;
  /** When set, renders a trailing "×" that calls this instead of toggling. */
  onRemove?: () => void;
}

/** A filter / choice chip. Use in a horizontally scrolling row. */
export function Chip({ label, selected = false, onPress, icon, onRemove }: ChipProps) {
  const className = cn(
    "min-h-9 flex-row items-center gap-1.5 rounded-full border px-3",
    selected
      ? "border-primary-500 bg-primary-500"
      : "border-outline-100 bg-background-0",
  );
  const textClass = cn(
    "text-sm font-medium",
    selected ? "text-typography-0" : "text-typography-500",
  );

  const content = (
    <>
      {icon ? (
        <View className="h-3.5 w-3.5 items-center justify-center">{icon}</View>
      ) : null}
      <Text className={textClass}>{label}</Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          className="ml-0.5 h-4 w-4 items-center justify-center rounded-full"
        >
          <Text className={cn(textClass, "text-xs")}>×</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        className={className}
      >
        {content}
      </Pressable>
    );
  }
  return <View className={className}>{content}</View>;
}
