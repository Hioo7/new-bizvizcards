import { FileText, X } from "lucide-react";
import Pagination from "@components/Pagination";
import { useMigrationRecords } from "../hooks/useMigrationRecords";
import {
  MIGRATION_DOMAIN_OPTIONS,
  MIGRATION_RECORD_STATUS_OPTIONS,
} from "../config";
import MigrationResultsTable from "./MigrationResultsTable";

interface MigrationReportModalProps {
  jobId: string;
  onClose: () => void;
}

export default function MigrationReportModal({
  jobId,
  onClose,
}: MigrationReportModalProps) {
  const {
    records,
    total,
    page,
    pageSize,
    domainFilter,
    statusFilter,
    reasonFilter,
    isLoading,
    error,
    setPage,
    setDomainFilter,
    setStatusFilter,
    setReasonFilter,
  } = useMigrationRecords(jobId);

  const hasActiveFilters = Boolean(domainFilter || statusFilter || reasonFilter);

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box flex max-h-[88vh] w-11/12 max-w-3xl flex-col overflow-hidden p-0 sm:max-h-[80vh]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-base-content">
              Migration report
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="btn btn-square btn-sm min-h-11 min-w-11 border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-b border-base-300 bg-base-200/40 px-5 py-3 sm:flex-row">
          <select
            aria-label="Filter by domain"
            value={domainFilter ?? ""}
            onChange={(e) =>
              setDomainFilter(
                (e.target.value || undefined) as
                  | (typeof MIGRATION_DOMAIN_OPTIONS)[number]["value"]
                  | undefined,
              )
            }
            className="select select-sm min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content focus:border-primary focus:outline-none"
          >
            <option value="">All domains</option>
            {MIGRATION_DOMAIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter ?? ""}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value || undefined) as
                  | (typeof MIGRATION_RECORD_STATUS_OPTIONS)[number]["value"]
                  | undefined,
              )
            }
            className="select select-sm min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content focus:border-primary focus:outline-none"
          >
            <option value="">All statuses</option>
            {MIGRATION_RECORD_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            placeholder="Search reason…"
            className="input input-sm min-h-11 flex-1 rounded-field border border-base-300 bg-base-100 text-base-content focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-2">
          <MigrationResultsTable
            records={records}
            isLoading={isLoading}
            error={error}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="shrink-0">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
