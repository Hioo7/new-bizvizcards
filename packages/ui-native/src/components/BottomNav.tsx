import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { cn } from "../utils/cn";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * The app-shell tab bar. Render once at the root of the authenticated shell.
 * The consumer pins it (safe-area padding) and offsets page content.
 */
export function BottomNav({ items, activeKey, onSelect }: BottomNavProps) {
  return (
    <View className="h-16 flex-row items-stretch border-t border-outline-100 bg-background-0">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.key)}
            className="flex-1 items-center justify-center gap-0.5"
          >
            <View
              className={cn(
                "h-6 w-6 items-center justify-center",
                active ? "opacity-100" : "opacity-40",
              )}
            >
              {item.icon}
            </View>
            <Text
              className={cn(
                "text-[10px] font-medium leading-none",
                active ? "text-primary-600" : "text-typography-400",
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
