import { Info } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  tooltip?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  tooltip,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        {trend && trend !== "neutral" && (
          <span
            className={`badge badge-sm ${
              trend === "up" ? "badge-success" : "badge-error"
            }`}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-base-content">{value}</p>
      <div className="flex items-center gap-1">
        <p className="text-xs text-base-content/60">{label}</p>
        {tooltip && (
          <button
            type="button"
            className="tooltip tooltip-top -m-2 flex items-center justify-center rounded-full p-2 active:bg-base-200"
            data-tip={tooltip}
            aria-label={`About ${label}`}
          >
            <Info className="h-3.5 w-3.5 text-base-content/40" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
