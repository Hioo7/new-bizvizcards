import { UserRound } from "lucide-react";
import { ecardPublicPath } from "@config/routes";
import type { EcardTeamComponent, EcardTeamMember } from "@app-types/ecard";

interface TeamSectionProps {
  component: EcardTeamComponent;
}

function TeamMemberAvatar({ member }: { member: EcardTeamMember }) {
  const { ecardEndpoint } = member;
  const avatarInner = member.photoUrl ? (
    <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover object-top" />
  ) : (
    <UserRound className="h-8 w-8" />
  );

  if (!ecardEndpoint) {
    return (
      <div
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-base-300 bg-base-200 text-base-content/50 opacity-50"
        title={member.name}
      >
        {avatarInner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        window.open(ecardPublicPath(ecardEndpoint), "_blank", "noopener,noreferrer")
      }
      title={member.name}
      aria-label={`Open ${member.name}'s e-card`}
      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-base-300 bg-base-200 text-base-content/50 transition hover:border-primary/50 active:scale-95"
    >
      {avatarInner}
    </button>
  );
}

export function TeamSection({ component }: TeamSectionProps) {
  if (component.members.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <h3 className="mb-2 text-xl font-semibold break-words">{component.title || "Team"}</h3>
      <div className="flex flex-nowrap justify-center-safe gap-4 overflow-x-auto pb-1">
        {component.members.map((member) => (
          <TeamMemberAvatar key={member.organisationMemberId} member={member} />
        ))}
      </div>
    </div>
  );
}
