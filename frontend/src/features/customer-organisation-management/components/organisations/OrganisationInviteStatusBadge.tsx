import { Ban, CircleCheck, Clock, XCircle } from "lucide-react";
import type { OrganisationInviteAdminItem } from "@app-types/organisation";

interface OrganisationInviteStatusBadgeProps {
  status: OrganisationInviteAdminItem["status"];
}

export default function OrganisationInviteStatusBadge({
  status,
}: OrganisationInviteStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
          <CircleCheck className="h-3 w-3" />
          Accepted
        </span>
      );
    case "RESOLVED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
          <CircleCheck className="h-3 w-3" />
          Resolved
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-base-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
          <XCircle className="h-3 w-3" />
          Expired
        </span>
      );
    case "REVOKED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-base-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
          <Ban className="h-3 w-3" />
          Revoked
        </span>
      );
  }
}
