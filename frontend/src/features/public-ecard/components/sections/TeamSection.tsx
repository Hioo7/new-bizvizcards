import { Download, Mail, Phone, UserRound } from "lucide-react";
import { ecardVCardUrl } from "@services/publicEcardService";
import type { EcardTeamComponent, EcardTeamMember } from "@app-types/ecard";

interface TeamSectionProps {
  component: EcardTeamComponent;
}

function TeamMemberRow({ member }: { member: EcardTeamMember }) {
  const hasPhone = member.phoneCountryDialCode && member.phoneNumber;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">{member.name}</p>
        <p className="truncate text-xs text-gray-500">{member.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasPhone && (
          <a
            href={`tel:+${member.phoneCountryDialCode}${member.phoneNumber}`}
            aria-label={`Call ${member.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        <a
          href={`mailto:${member.email}`}
          aria-label={`Email ${member.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <Mail className="h-4 w-4" />
        </a>
        {member.ecardEndpoint && (
          <a
            href={ecardVCardUrl(member.ecardEndpoint)}
            aria-label={`Save ${member.name}'s contact`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
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
    <div className="px-6 py-6 bg-white border-b">
      <h3 className="font-semibold text-gray-800 mb-2 text-xl">
        {component.title || "Team"}
      </h3>
      <div>
        {component.members.map((member) => (
          <TeamMemberRow key={member.organisationMemberId} member={member} />
        ))}
      </div>
    </div>
  );
}
