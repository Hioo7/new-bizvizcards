import { CalendarDays, Pencil, Trash2, Users } from "lucide-react";
import type { EventSummary } from "@app-types/businessEvent";

interface EventRowProps {
  event: EventSummary;
  canDelete: boolean;
  onManage: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EventRow({
  event,
  canDelete,
  onManage,
  onEdit,
  onDelete,
}: EventRowProps) {
  return (
    <tr className="border-b border-base-300 last:border-b-0 hover:bg-base-200/50">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-base-content">
              {event.name}
            </p>
            <p className="truncate text-xs text-base-content/50">
              Hosted by {event.hostName}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pl-3 pr-3 text-sm text-base-content/70">
        {new Date(event.startAt).toLocaleDateString()}
      </td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Manage event"
            onClick={onManage}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-base-300 hover:text-primary"
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Edit event"
            onClick={onEdit}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-base-300 hover:text-base-content"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {canDelete && (
            <button
              type="button"
              aria-label="Delete event"
              onClick={onDelete}
              className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
