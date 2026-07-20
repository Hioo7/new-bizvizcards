import {
  MIGRATION_STATUS_LABELS,
  MIGRATION_STATUS_TONES,
  type MigrationStatusValue,
  type MigrationStatusTone,
} from "../config";

const TONE_CLASSES: Record<MigrationStatusTone, string> = {
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  neutral: "bg-base-200 text-base-content/50",
};

interface MigrationStatusBadgeProps {
  status: MigrationStatusValue;
}

export default function MigrationStatusBadge({
  status,
}: MigrationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-field px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[MIGRATION_STATUS_TONES[status]]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {MIGRATION_STATUS_LABELS[status]}
    </span>
  );
}
