import { History } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import Pagination from "@components/Pagination";
import type { MigrationJob } from "../types";
import MigrationJobRow from "./MigrationJobRow";

interface MigrationJobsTableProps {
  jobs: MigrationJob[];
  total: number;
  page: number;
  pageSize: number;
  selectedJobId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (jobId: string) => void;
  onPageChange: (page: number) => void;
}

export default function MigrationJobsTable({
  jobs,
  total,
  page,
  pageSize,
  selectedJobId,
  isLoading,
  error,
  onSelect,
  onPageChange,
}: MigrationJobsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <History className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">No migration jobs yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
              <th className="py-2 pl-4 pr-3 font-semibold">Started</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Progress</th>
              <th className="px-3 py-2 font-semibold">Success</th>
              <th className="px-3 py-2 font-semibold">Rejected</th>
              <th className="py-2 pl-3 pr-4 font-semibold">Skipped</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <MigrationJobRow
                key={job.id}
                job={job}
                isSelected={job.id === selectedJobId}
                onSelect={() => onSelect(job.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}
