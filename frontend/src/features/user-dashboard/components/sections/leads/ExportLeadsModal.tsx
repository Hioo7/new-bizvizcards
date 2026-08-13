import { useState } from "react";
import type { Lead, LeadFolder } from "@features/user-dashboard/types";
import { useExportLeadsSelection } from "@features/user-dashboard/hooks/useExportLeadsSelection";
import ExportSelectionToolbar from "./ExportSelectionToolbar";
import ExportFolderGroup from "./ExportFolderGroup";

interface ExportLeadsModalProps {
  open: boolean;
  leads: Lead[];
  folders: LeadFolder[];
  onClose: () => void;
  onExport: (leadIds: string[]) => Promise<void>;
}

export default function ExportLeadsModal({
  open,
  leads,
  folders,
  onClose,
  onExport,
}: ExportLeadsModalProps) {
  const {
    groups,
    selectedIds,
    selectedCount,
    totalCount,
    toggleLead,
    toggleGroup,
    selectAll,
    clear,
  } = useExportLeadsSelection(leads, folders);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    clear();
    setError(null);
    onClose();
  }

  async function handleExport() {
    setSubmitting(true);
    setError(null);
    try {
      await onExport(Array.from(selectedIds));
      clear();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export leads");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box p-0 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh]">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-2 px-5 pt-6 pb-4 border-b border-base-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-success" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-base-content">Export Leads</h3>
              <p className="text-xs text-base-content/50">
                Pick the leads you want to export as an Excel file
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base-content/40 hover:bg-base-200"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="shrink-0 px-4 border-b border-base-200 bg-base-100">
          <ExportSelectionToolbar
            selectedCount={selectedCount}
            totalCount={totalCount}
            onSelectAll={selectAll}
            onClear={clear}
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 flex flex-col gap-2 bg-base-200/40">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-base-content/30" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-base-content/60">
                No leads to export
              </p>
              <p className="mt-1 text-xs text-base-content/40">
                Add leads first, then come back to export them
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <ExportFolderGroup
                key={group.folder?.id ?? "uncategorised"}
                group={group}
                selectedIds={selectedIds}
                onToggleGroup={toggleGroup}
                onToggleLead={toggleLead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-base-300 bg-base-100 px-4 py-4">
          {error && (
            <p className="mb-2 text-xs text-error text-center">{error}</p>
          )}
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={selectedCount === 0 || submitting}
            className="btn btn-success w-full text-success-content disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Exporting…
              </>
            ) : selectedCount === 0 ? (
              "Export to Excel"
            ) : (
              `Export ${selectedCount} lead${selectedCount === 1 ? "" : "s"}`
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </dialog>
  );
}
