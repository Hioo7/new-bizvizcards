import { CircleCheck, PauseCircle } from "lucide-react";

interface OrganisationMemberStatusBadgeProps {
  status: "ACTIVE" | "SUSPENDED";
}

export default function OrganisationMemberStatusBadge({
  status,
}: OrganisationMemberStatusBadgeProps) {
  if (status === "SUSPENDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning">
        <PauseCircle className="h-3 w-3" />
        Suspended
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
