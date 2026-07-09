import type { LucideIcon } from "lucide-react";
import { Pencil } from "lucide-react";

interface ProfileListItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onEdit?: () => void;
}

export default function ProfileListItem({
  icon: Icon,
  label,
  value,
  onEdit,
}: ProfileListItemProps) {
  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-4 py-3.5 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/60">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-base-content">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          aria-label={`Edit ${label}`}
          onClick={onEdit}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-field text-base-content/40 hover:bg-base-200 hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
