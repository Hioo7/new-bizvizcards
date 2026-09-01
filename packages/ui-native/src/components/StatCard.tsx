import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { cn } from "../utils/cn";

export type StatTrend = "up" | "down" | "neutral";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** Directional pill in the top-right; `neutral` hides it. */
  trend?: StatTrend;
  /** Short delta text next to the trend arrow (e.g. "+12%"). */
  trendLabel?: string;
}

/** A single metric tile for the analytics grid. */
export function StatCard({
  label,
  value,
  icon,
  trend = "neutral",
  trendLabel,
}: StatCardProps) {
  return (
    <View className="rounded-box border border-outline-100 bg-background-0 p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-field bg-primary-500/10">
          {icon}
        </View>
        {trend !== "neutral" ? (
          <View
            className={cn(
              "flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5",
              trend === "up" ? "bg-success-500" : "bg-error-500",
            )}
          >
            <Text className="text-[10px] font-semibold text-typography-0">
              {trend === "up" ? "↑" : "↓"}
              {trendLabel ? ` ${trendLabel}` : ""}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="text-2xl font-bold text-typography-900">{value}</Text>
      <Text className="mt-0.5 text-xs text-typography-500">{label}</Text>
    </View>
  );
}
