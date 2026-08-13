import type { Lead } from "@features/user-dashboard/types";

interface ExportLeadRowProps {
  lead: Lead;
  checked: boolean;
  onToggle: (id: string) => void;
}

export default function ExportLeadRow({
  lead,
  checked,
  onToggle,
}: ExportLeadRowProps) {
  const secondaryLine = lead.email || lead.phoneNumber || "";

  return (
    <label className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-base-200/60 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(lead.id)}
        className="checkbox checkbox-primary checkbox-sm shrink-0"
      />
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/40">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-base-content">
          {lead.name}
        </p>
        {secondaryLine && (
          <p className="truncate text-xs text-base-content/50">
            {secondaryLine}
          </p>
        )}
      </div>
    </label>
  );
}
