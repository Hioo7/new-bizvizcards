import { Contact, Crown, PauseCircle, PlayCircle, User, UserMinus } from "lucide-react";
import type { OrganisationMemberSummary } from "@app-types/ecard";
import OrganisationMemberRoleBadge from "@features/customer-organisation-management/components/organisations/OrganisationMemberRoleBadge";
import OrganisationMemberStatusBadge from "@features/customer-organisation-management/components/organisations/OrganisationMemberStatusBadge";
import LinkedEcardButton from "@features/customer-organisation-management/components/organisations/LinkedEcardButton";

interface OrganisationMemberCardProps {
  member: OrganisationMemberSummary;
  onToggleRole: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
  onManageEcards: () => void;
  onLinkEcard: () => void;
}

export default function OrganisationMemberCard({
  member,
  onToggleRole,
  onToggleStatus,
  onRemove,
  onManageEcards,
  onLinkEcard,
}: OrganisationMemberCardProps) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4">
      <p className="font-semibold text-base-content">{member.name}</p>
      <p className="text-xs text-base-content/60">{member.email}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OrganisationMemberRoleBadge role={member.role} />
        <OrganisationMemberStatusBadge status={member.status} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-base-300 pt-3">
        <button
          type="button"
          onClick={onManageEcards}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-field border border-base-300 text-sm text-base-content/70"
        >
          <Contact className="h-4 w-4" />
          E-cards
        </button>
        <LinkedEcardButton
          memberName={member.name}
          linkedEcard={member.linkedEcard}
          onClick={onLinkEcard}
          variant="card"
        />
        <button
          type="button"
          aria-label={
            member.role === "SPOC"
              ? `Demote ${member.name} to member`
              : `Promote ${member.name} to SPOC`
          }
          onClick={onToggleRole}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-base-content/70"
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
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-base-content/70"
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
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-error"
        >
          <UserMinus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
