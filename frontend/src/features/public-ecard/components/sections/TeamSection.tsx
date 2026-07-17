import { Download, Mail, Phone, UserRound } from "lucide-react";
import { ecardVCardUrl } from "@services/publicEcardService";
import type { EcardTeamComponent, EcardTeamMember } from "@app-types/ecard";

interface TeamSectionProps {
  component: EcardTeamComponent;
}

function TeamMemberRow({ member }: { member: EcardTeamMember }) {
  const hasPhone = member.phoneCountryDialCode && member.phoneNumber;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-base-300/60 last:border-b-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-200 text-base-content/50">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{member.name}</p>
        <p className="truncate text-xs text-base-content/60">{member.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasPhone && (
          <a
            href={`tel:+${member.phoneCountryDialCode}${member.phoneNumber}`}
            aria-label={`Call ${member.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/15 text-green-400 hover:bg-green-500/25"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        <a
          href={`mailto:${member.email}`}
          aria-label={`Email ${member.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
        >
          <Mail className="h-4 w-4" />
        </a>
        {member.ecardEndpoint && (
          <a
            href={ecardVCardUrl(member.ecardEndpoint)}
            aria-label={`Save ${member.name}'s contact`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export function TeamSection({ component }: TeamSectionProps) {
  if (component.members.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <h3 className="mb-2 text-xl font-semibold">{component.title || "Team"}</h3>
      <div>
        {component.members.map((member) => (
          <TeamMemberRow key={member.organisationMemberId} member={member} />
        ))}
      </div>
    </div>
  );
}
