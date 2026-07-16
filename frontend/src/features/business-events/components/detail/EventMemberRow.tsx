import { User, UserMinus } from "lucide-react";
import type { EventMemberListItem } from "@app-types/businessEvent";

const ROLE_LABELS: Record<EventMemberListItem["role"], string> = {
  HOST: "Host",
  CO_HOST: "Co-Host",
  VOLUNTEER: "Volunteer",
};

interface EventMemberRowProps {
  member: EventMemberListItem;
  onRemove: () => void;
}

export default function EventMemberRow({
  member,
  onRemove,
}: EventMemberRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
        <User className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-base-content">
          {member.name}
        </p>
        <p className="truncate text-xs text-base-content/50">
          {member.email}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold text-base-content/70">
        {ROLE_LABELS[member.role]}
      </span>
      {member.role !== "HOST" && (
        <button
          type="button"
          aria-label="Remove member"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <UserMinus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
