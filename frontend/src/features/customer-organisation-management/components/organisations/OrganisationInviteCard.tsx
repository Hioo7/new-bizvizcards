import { Ban, UserCheck, UserPlus } from "lucide-react";
import type { OrganisationInviteAdminItem } from "@app-types/organisation";
import OrganisationMemberRoleBadge from "@features/customer-organisation-management/components/organisations/OrganisationMemberRoleBadge";
import OrganisationInviteStatusBadge from "@features/customer-organisation-management/components/organisations/OrganisationInviteStatusBadge";

interface OrganisationInviteCardProps {
  invite: OrganisationInviteAdminItem;
  onLinkExisting: () => void;
  onCreateAndLink: () => void;
  onRevoke: () => void;
}

export default function OrganisationInviteCard({
  invite,
  onLinkExisting,
  onCreateAndLink,
  onRevoke,
}: OrganisationInviteCardProps) {
  const isPending = invite.status === "PENDING";

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4">
      <p className="font-semibold text-base-content">{invite.email}</p>
      <p className="text-xs text-base-content/60">
        Invited by {invite.invitedByName}
        {invite.resolvedByEmployeeName &&
          ` · Resolved by ${invite.resolvedByEmployeeName}`}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OrganisationMemberRoleBadge role={invite.role} />
        <OrganisationInviteStatusBadge status={invite.status} />
      </div>

      {isPending && (
        <div className="mt-3 flex items-center gap-2 border-t border-base-300 pt-3">
          <button
            type="button"
            onClick={onLinkExisting}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-field border border-base-300 text-sm text-base-content/70"
          >
            <UserCheck className="h-4 w-4" />
            Link
          </button>
          <button
            type="button"
            onClick={onCreateAndLink}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-field border border-base-300 text-sm text-base-content/70"
          >
            <UserPlus className="h-4 w-4" />
            Create
          </button>
          <button
            type="button"
            aria-label="Revoke invite"
            onClick={onRevoke}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-error"
          >
            <Ban className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
