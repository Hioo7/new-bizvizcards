import { FileSearch } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import type { MigrationRecord } from "../types";
import MigrationStatusBadge from "./MigrationStatusBadge";

interface MigrationResultsTableProps {
  records: MigrationRecord[];
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
}

export default function MigrationResultsTable({
  records,
  isLoading,
  error,
  hasActiveFilters,
}: MigrationResultsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <FileSearch className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters
            ? "No results match your filters."
            : "No results yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
            <th className="py-2 pl-4 pr-3 font-semibold">Domain</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="py-2 pl-3 pr-4 font-semibold">Reason</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-base-200">
              <td className="py-2.5 pl-4 pr-3 whitespace-nowrap text-base-content/80">
                {record.domain}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-base-content/60">
                {record.sourceTable}#{record.sourceId.slice(0, 8)}
              </td>
              <td className="px-3 py-2.5">
                <MigrationStatusBadge status={record.status} />
              </td>
              <td className="py-2.5 pl-3 pr-4 text-base-content/80">
                {record.reason ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
