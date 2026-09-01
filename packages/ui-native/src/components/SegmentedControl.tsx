import { View, Text, Pressable } from "react-native";
import { cn } from "../utils/cn";

export interface SegmentedOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Stretch each segment to equal width. */
  block?: boolean;
  accessibilityLabel?: string;
}

/**
 * Compact pill toggle for switching between a small set of mutually exclusive
 * views (e.g. a lead-list filter). Use `Tabs` for section navigation.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  block = false,
  accessibilityLabel,
}: SegmentedControlProps) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        "flex-row gap-1 rounded-field bg-background-50 p-1",
        block ? "w-full" : "self-start",
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            className={cn(
              "min-h-9 items-center justify-center rounded-selector px-3",
              block && "flex-1",
              selected && "bg-background-0 shadow-sm",
            )}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                selected ? "text-typography-900" : "text-typography-500",
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
