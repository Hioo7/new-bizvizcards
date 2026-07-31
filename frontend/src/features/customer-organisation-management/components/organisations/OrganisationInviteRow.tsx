import { Ban, UserCheck, UserPlus } from "lucide-react";
import type { OrganisationInviteAdminItem } from "@app-types/organisation";
import OrganisationMemberRoleBadge from "@features/customer-organisation-management/components/organisations/OrganisationMemberRoleBadge";
import OrganisationInviteStatusBadge from "@features/customer-organisation-management/components/organisations/OrganisationInviteStatusBadge";

interface OrganisationInviteRowProps {
  invite: OrganisationInviteAdminItem;
  onLinkExisting: () => void;
  onCreateAndLink: () => void;
  onRevoke: () => void;
}

export default function OrganisationInviteRow({
  invite,
  onLinkExisting,
  onCreateAndLink,
  onRevoke,
}: OrganisationInviteRowProps) {
  const isPending = invite.status === "PENDING";

  return (
    <tr className="border-b border-base-300 last:border-b-0 hover:bg-base-200/50">
      <td className="py-3 pl-4 pr-3">
        <p className="font-semibold text-base-content">{invite.email}</p>
        <p className="text-xs text-base-content/60">
          Invited by {invite.invitedByName}
          {invite.resolvedByEmployeeName &&
            ` · Resolved by ${invite.resolvedByEmployeeName}`}
        </p>
      </td>
      <td className="px-3 py-3">
        <OrganisationMemberRoleBadge role={invite.role} />
      </td>
      <td className="px-3 py-3">
        <OrganisationInviteStatusBadge status={invite.status} />
      </td>
      <td className="py-3 pl-3 pr-4">
        {isPending && (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label="Link existing account"
              title="Link existing account"
              onClick={onLinkExisting}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
            >
              <UserCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Create account"
              title="Create account"
              onClick={onCreateAndLink}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-secondary"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Revoke invite"
              title="Revoke invite"
              onClick={onRevoke}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
            >
              <Ban className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
