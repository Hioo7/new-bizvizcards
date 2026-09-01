import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { cn } from "../utils/cn";

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Stretch tabs to fill the row. */
  block?: boolean;
}

/** Underlined section navigation within a screen. */
export function Tabs({ items, activeKey, onSelect, block = false }: TabsProps) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn("flex-row border-b border-outline-100", block && "w-full")}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.key)}
            className={cn(
              "min-h-[44px] flex-row items-center justify-center gap-1.5 border-b-2 px-3",
              block && "flex-1",
              active ? "border-primary-600" : "border-transparent",
            )}
          >
            {item.icon ? (
              <View className="h-4 w-4 items-center justify-center">
                {item.icon}
              </View>
            ) : null}
            <Text
              className={cn(
                "text-sm font-medium",
                active ? "text-primary-600" : "text-typography-500",
              )}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
