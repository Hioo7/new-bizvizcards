import { CheckCircle2, User, UserMinus } from "lucide-react";
import type { EventGuestListItem } from "@app-types/businessEvent";

interface EventGuestRowProps {
  guest: EventGuestListItem;
  onRemove: () => void;
}

export default function EventGuestRow({ guest, onRemove }: EventGuestRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
        <User className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-base-content">
          {guest.name}
        </p>
        <p className="truncate text-xs text-base-content/50">
          {guest.email}
        </p>
      </div>
      {guest.checkedInAt ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Checked in
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold text-base-content/50">
          Not checked in
        </span>
      )}
      <button
        type="button"
        aria-label="Remove guest"
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-error/10 hover:text-error"
      >
        <UserMinus className="h-4 w-4" />
      </button>
    </div>
  );
}
