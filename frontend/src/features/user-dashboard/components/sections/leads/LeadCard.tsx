import type { Lead } from "@features/user-dashboard/types";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const subtitle =
    lead.email ??
    (lead.phoneNumber
      ? `${lead.countryDialCode ?? ""}${lead.phoneNumber}`
      : null);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm">
      {/* Blue square person icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6 text-primary-content"
          aria-hidden="true"
        >
          <path
            d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-base-content">
          {lead.name}
        </p>
        {subtitle && (
          <p className="truncate text-xs text-base-content/60">{subtitle}</p>
        )}
      </div>

      {/* Info action button */}
      <button
        type="button"
        onClick={() => onClick(lead)}
        aria-label={`View details for ${lead.name}`}
        className="flex h-9 w-9 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-content transition-opacity hover:opacity-80 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 8h.01M12 12v4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
