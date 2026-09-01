import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type StatTrend = "up" | "down" | "neutral";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** Directional pill in the top-right; `neutral` hides it. */
  trend?: StatTrend;
  /** Short delta text shown next to the trend arrow (e.g. "+12%"). */
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
    <div className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-field bg-primary/10 text-primary">
          {icon}
        </div>
        {trend !== "neutral" ? (
          <span
            className={cn(
              "badge badge-sm gap-0.5",
              trend === "up" ? "badge-success" : "badge-error",
            )}
          >
            <span aria-hidden="true">{trend === "up" ? "↑" : "↓"}</span>
            {trendLabel}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-bold text-base-content">{value}</p>
      <p className="mt-0.5 text-xs text-base-content/60">{label}</p>
    </div>
  );
}
