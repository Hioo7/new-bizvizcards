import type { Lead } from "@features/user-dashboard/types";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const initials = getInitials(lead.name);
  const subtitle = lead.email ?? (lead.phoneNumber ? `${lead.countryDialCode ?? ""}${lead.phoneNumber}` : null);

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-base-200 active:bg-base-300"
      onClick={() => onClick(lead)}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-base-content">
          {lead.name}
        </p>
        {subtitle && (
          <p className="truncate text-xs text-base-content/60">{subtitle}</p>
        )}
      </div>

      {/* Date */}
      <span className="shrink-0 text-xs text-base-content/40">
        {formatShortDate(lead.createdAt)}
      </span>
    </button>
  );
}
