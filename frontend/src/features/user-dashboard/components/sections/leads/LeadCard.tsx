import type { Lead, OpportunityStage } from "@features/user-dashboard/types";
import {
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
} from "@features/user-dashboard/types";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

function StageIcon({ stage }: { stage: OpportunityStage }) {
  switch (stage) {
    case "LEAD":
      return (
        // Person / contact
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "QUALIFIED_LEAD":
      return (
        // Check badge
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "NEEDS_ANALYSIS":
      return (
        // Magnifier
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "PROPOSAL_DEMO":
      return (
        // Presentation / document
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "NEGOTIATION":
      return (
        // Handshake / scales
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M6 9l6-6 6 6M6 15l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "CLOSED_WON":
      return (
        // Trophy
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M8 21h8M12 17v4M5 3H3v4a4 4 0 004 4h10a4 4 0 004-4V3h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 3h14v6a7 7 0 01-14 0V3z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "ONBOARDING":
      return (
        // Rocket
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ACTIVE_RETENTION":
      return (
        // Shield / heart
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "CHURNED_CLOSED_LOST":
      return (
        // X circle
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
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
        {lead.stage && (
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${OPPORTUNITY_STAGE_COLORS[lead.stage]}`}
          >
            <StageIcon stage={lead.stage} />
            {OPPORTUNITY_STAGE_LABELS[lead.stage]}
          </span>
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
