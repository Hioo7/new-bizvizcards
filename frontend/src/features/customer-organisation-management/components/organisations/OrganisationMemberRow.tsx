import { Contact, Crown, PauseCircle, PlayCircle, User, UserMinus } from "lucide-react";
import type { OrganisationMemberSummary } from "@app-types/ecard";
import OrganisationMemberRoleBadge from "@features/customer-organisation-management/components/organisations/OrganisationMemberRoleBadge";
import OrganisationMemberStatusBadge from "@features/customer-organisation-management/components/organisations/OrganisationMemberStatusBadge";
import LinkedEcardButton from "@features/customer-organisation-management/components/organisations/LinkedEcardButton";

interface OrganisationMemberRowProps {
  member: OrganisationMemberSummary;
  onToggleRole: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
  onManageEcards: () => void;
  onLinkEcard: () => void;
}

export default function OrganisationMemberRow({
  member,
  onToggleRole,
  onToggleStatus,
  onRemove,
  onManageEcards,
  onLinkEcard,
}: OrganisationMemberRowProps) {
  return (
    <tr className="border-b border-base-300 last:border-b-0 hover:bg-base-200/50">
      <td className="py-3 pl-4 pr-3">
        <p className="font-semibold text-base-content">{member.name}</p>
        <p className="text-xs text-base-content/60">{member.email}</p>
      </td>
      <td className="px-3 py-3">
        <OrganisationMemberRoleBadge role={member.role} />
      </td>
      <td className="px-3 py-3">
        <OrganisationMemberStatusBadge status={member.status} />
      </td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Manage e-cards for ${member.name}`}
            onClick={onManageEcards}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-secondary"
          >
            <Contact className="h-4 w-4" />
          </button>
          <LinkedEcardButton
            memberName={member.name}
            linkedEcard={member.linkedEcard}
            onClick={onLinkEcard}
          />
          <button
            type="button"
            aria-label={
              member.role === "SPOC"
                ? `Demote ${member.name} to member`
                : `Promote ${member.name} to SPOC`
            }
            onClick={onToggleRole}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
          >
            {member.role === "SPOC" ? (
              <User className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            aria-label={
              member.status === "SUSPENDED"
                ? `Reactivate ${member.name}`
                : `Suspend ${member.name}`
            }
            onClick={onToggleStatus}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-warning"
          >
            {member.status === "SUSPENDED" ? (
              <PlayCircle className="h-4 w-4" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            aria-label={`Remove ${member.name}`}
            onClick={onRemove}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
          >
            <UserMinus className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
