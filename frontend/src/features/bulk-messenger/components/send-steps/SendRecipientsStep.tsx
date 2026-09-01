import type { ValidLeadRow } from "@app-types/bulkMessenger";

interface SendRecipientsStepProps {
  rows: ValidLeadRow[];
  isLoading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  onToggle: (leadId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

function subtitle(row: ValidLeadRow): string {
  if (row.email) return row.email;
  if (row.countryDialCode && row.phoneNumber) {
    return `${row.countryDialCode} ${row.phoneNumber}`;
  }
  return "No contact details";
}

export default function SendRecipientsStep({
  rows,
  isLoading,
  error,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: SendRecipientsStepProps) {
  if (isLoading) {
    return <p className="text-sm text-base-content/50">Loading recipients…</p>;
  }
  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-base-content/50">
        No leads match this template yet.
      </p>
    );
  }

  const selectableCount = rows.filter((row) => row.hasUsablePhone).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-base-content/60">
          {selectedIds.size} of {selectableCount} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="font-medium text-primary hover:underline"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="font-medium text-base-content/60 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-field border border-base-300">
        {rows.map((row) => {
          const disabled = !row.hasUsablePhone;
          const checked = selectedIds.has(row.leadId);
          return (
            <label
              key={row.leadId}
              className={`flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0 ${
                disabled ? "opacity-50" : "cursor-pointer hover:bg-base-200"
              }`}
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(row.leadId)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-base-content">
                  {row.name}
                </span>
                <span className="block truncate text-xs text-base-content/50">
                  {subtitle(row)}
                </span>
              </span>
              {disabled && (
                <span className="shrink-0 rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-medium text-base-content/50">
                  No phone
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
