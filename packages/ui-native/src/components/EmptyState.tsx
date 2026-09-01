import type { ReactNode } from "react";
import { View, Text } from "react-native";

export interface EmptyStateProps {
  /** Large muted icon above the title. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary recovery action (usually a `Button`). */
  action?: ReactNode;
}

/** The zero-data state for a list or section. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="items-center px-6 py-12">
      {icon ? (
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-box bg-background-50">
          {icon}
        </View>
      ) : null}
      <Text className="text-base font-semibold text-typography-900">{title}</Text>
      {description ? (
        <Text className="mt-1 max-w-xs text-center text-sm text-typography-500">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
