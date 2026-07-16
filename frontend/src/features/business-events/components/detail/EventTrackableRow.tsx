import { Gift, Pencil, Trash2 } from "lucide-react";
import type { EventTrackableListItem } from "@app-types/businessEvent";

interface EventTrackableRowProps {
  trackable: EventTrackableListItem;
  onEdit: () => void;
  onRemove: () => void;
}

export default function EventTrackableRow({
  trackable,
  onEdit,
  onRemove,
}: EventTrackableRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
        <Gift className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-base-content">
          {trackable.name}
        </p>
        {trackable.description && (
          <p className="truncate text-xs text-base-content/50">
            {trackable.description}
          </p>
        )}
        {trackable.dependencies.length > 0 && (
          <p className="truncate text-xs text-base-content/50">
            Depends on:{" "}
            {trackable.dependencies.map((dependency) => dependency.name).join(", ")}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold text-base-content/70">
        {trackable.redemptionCount} redeemed
      </span>
      <button
        type="button"
        aria-label="Edit trackable"
        onClick={onEdit}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-base-300 hover:text-base-content"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Delete trackable"
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-error/10 hover:text-error"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
