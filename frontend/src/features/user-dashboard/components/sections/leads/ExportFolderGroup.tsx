import { useEffect, useRef, useState } from "react";
import type { ExportFolderGroup as ExportFolderGroupData } from "@features/user-dashboard/hooks/useExportLeadsSelection";
import { LEADS_EXPORT_UNCATEGORISED_LABEL } from "@features/user-dashboard/config";
import ExportLeadRow from "./ExportLeadRow";

interface ExportFolderGroupProps {
  group: ExportFolderGroupData;
  selectedIds: Set<string>;
  onToggleGroup: (group: ExportFolderGroupData) => void;
  onToggleLead: (id: string) => void;
}

export default function ExportFolderGroup({
  group,
  selectedIds,
  onToggleGroup,
  onToggleLead,
}: ExportFolderGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = group.state === "indeterminate";
    }
  }, [group.state]);

  return (
    <div className="rounded-xl border border-base-200 bg-base-100">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={group.state === "checked"}
          onChange={() => onToggleGroup(group)}
          className="checkbox checkbox-primary checkbox-sm shrink-0"
          aria-label={`Select all leads in ${group.folder?.name ?? LEADS_EXPORT_UNCATEGORISED_LABEL}`}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center justify-between gap-2 min-w-0"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-semibold text-base-content">
              {group.folder?.name ?? LEADS_EXPORT_UNCATEGORISED_LABEL}
            </span>
            <span className="shrink-0 text-xs text-base-content/40">
              {group.leads.length}
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`h-4 w-4 shrink-0 text-base-content/40 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <polyline
              points="6 9 12 15 18 9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-0.5 border-t border-base-200 px-2 pb-2 pt-1">
          {group.leads.map((lead) => (
            <ExportLeadRow
              key={lead.id}
              lead={lead}
              checked={selectedIds.has(lead.id)}
              onToggle={onToggleLead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
