import { useState } from "react";
import { CheckCircle2, Database, FileText, SkipForward, XCircle } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { useMigrationJobPolling } from "../hooks/useMigrationJobPolling";
import MigrationStatusBadge from "./MigrationStatusBadge";
import MigrationStatCard from "./MigrationStatCard";
import MigrationReportModal from "./MigrationReportModal";

interface MigrationJobDetailProps {
  jobId: string;
}

export default function MigrationJobDetail({ jobId }: MigrationJobDetailProps) {
  const { job, isLoading, error } = useMigrationJobPolling(jobId);
  const [isReportOpen, setIsReportOpen] = useState(false);

  if (isLoading && !job) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (!job) {
    return null;
  }

  const isRunning = job.status === "PENDING" || job.status === "RUNNING";

  return (
    <div className="flex flex-col gap-4 rounded-field border border-base-300 bg-base-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-base-content">
            Migration job
          </h2>
          <MigrationStatusBadge status={job.status} />
        </div>
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="btn btn-sm min-h-11 gap-2 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
        >
          <FileText className="h-4 w-4" />
          View report
        </button>
      </div>

      {isRunning && (
        <div className="flex flex-col gap-1.5">
          <progress
            className="progress progress-primary w-full"
            value={job.processedRecords}
            max={Math.max(job.totalRecords, job.processedRecords, 1)}
          />
          <p className="text-xs text-base-content/60">
            {job.processedRecords} records processed (~{job.totalRecords}{" "}
            primary records estimated)
          </p>
        </div>
      )}

      {job.status === "FAILED" && job.errorMessage && (
        <FormErrorRibbon message={job.errorMessage} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MigrationStatCard
          label="Success"
          value={job.successCount}
          icon={CheckCircle2}
          tone="success"
        />
        <MigrationStatCard
          label="Rejected"
          value={job.rejectedCount}
          icon={XCircle}
          tone="error"
        />
        <MigrationStatCard
          label="Skipped"
          value={job.skippedCount}
          icon={SkipForward}
          tone="warning"
        />
        <MigrationStatCard
          label="Primary records"
          value={job.totalRecords}
          icon={Database}
          tone="info"
          tooltip="Legacy records identified before this job started (customers, cards, organisations, leads, etc.). Success, Rejected, and Skipped also count each photo or logo transferred separately, so their totals can be higher than this number."
        />
      </div>

      {isReportOpen && (
        <MigrationReportModal
          jobId={job.id}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}
