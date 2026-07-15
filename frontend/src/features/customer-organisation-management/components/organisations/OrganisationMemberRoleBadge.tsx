import { Crown, User } from "lucide-react";

interface OrganisationMemberRoleBadgeProps {
  role: "SPOC" | "MEMBER";
}

export default function OrganisationMemberRoleBadge({
  role,
}: OrganisationMemberRoleBadgeProps) {
  if (role === "SPOC") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
        <Crown className="h-3 w-3" />
        SPOC
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-base-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
      <User className="h-3 w-3" />
      Member
    </span>
  );
}
