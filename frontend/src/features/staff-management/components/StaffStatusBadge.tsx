import { Ban, CircleCheck } from "lucide-react";

interface StaffStatusBadgeProps {
  banned: boolean | null;
}

export default function StaffStatusBadge({ banned }: StaffStatusBadgeProps) {
  if (banned) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-error">
        <Ban className="h-3 w-3" />
        Banned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
      <CircleCheck className="h-3 w-3" />
      Active
    </span>
  );
}
