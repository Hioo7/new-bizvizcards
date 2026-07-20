import { Info, type LucideIcon } from "lucide-react";
import type { MigrationStatusTone } from "../config";

const ICON_WRAPPER_TONE_CLASSES: Record<MigrationStatusTone, string> = {
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  neutral: "bg-base-200 text-base-content/60",
};

interface MigrationStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: MigrationStatusTone;
  tooltip?: string;
}

export default function MigrationStatCard({
  label,
  value,
  icon: Icon,
  tone,
  tooltip,
}: MigrationStatCardProps) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${ICON_WRAPPER_TONE_CLASSES[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-base-content">{value}</p>
      <div className="flex items-center gap-1">
        <p className="text-xs text-base-content/60">{label}</p>
        {tooltip && (
          <div className="tooltip tooltip-top" data-tip={tooltip}>
            <Info className="h-3.5 w-3.5 text-base-content/40" />
          </div>
        )}
      </div>
    </div>
  );
}
