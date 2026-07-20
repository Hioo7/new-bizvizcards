import { useState } from "react";
import { DatabaseZap } from "lucide-react";
import { useMigrationPreflight } from "../hooks/useMigrationPreflight";
import { useMigrationJobs } from "../hooks/useMigrationJobs";
import MigrationPreflightChecklist from "./MigrationPreflightChecklist";
import MigrationStartPanel from "./MigrationStartPanel";
import MigrationJobDetail from "./MigrationJobDetail";
import MigrationJobsTable from "./MigrationJobsTable";

export default function DataMigrationApp() {
  const { summary: preflightSummary } = useMigrationPreflight();
  const jobsState = useMigrationJobs();
  const [explicitlySelectedJobId, setSelectedJobId] = useState<string | null>(
    null,
  );

  // Defaults to the most recent job once the history loads, so the detail
  // panel isn't empty on first visit — derived at render time rather than
  // synced via an effect, so it never overrides an explicit selection but
  // also never needs a setState-in-effect reset.
  const selectedJobId =
    explicitlySelectedJobId ?? jobsState.jobs[0]?.id ?? null;

  async function handleStart() {
    const job = await jobsState.start();
    setSelectedJobId(job.id);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <DatabaseZap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-base-content">
            Data migration
          </h1>
          <p className="text-sm text-base-content/60">
            Migrate legacy customer, card, and lead data into this app.
          </p>
        </div>
      </header>

      <MigrationPreflightChecklist />

      <MigrationStartPanel
        canStart={preflightSummary?.canStart ?? false}
        isStarting={jobsState.isStarting}
        startError={jobsState.startError}
        onStart={() => void handleStart()}
      />

      {selectedJobId && <MigrationJobDetail jobId={selectedJobId} />}

      <div className="rounded-field border border-base-300 bg-base-100 p-4 sm:p-6">
        <h2 className="mb-3 text-base font-bold text-base-content">
          Job history
        </h2>
        <MigrationJobsTable
          jobs={jobsState.jobs}
          total={jobsState.total}
          page={jobsState.page}
          pageSize={jobsState.pageSize}
          selectedJobId={selectedJobId}
          isLoading={jobsState.isLoading}
          error={jobsState.error}
          onSelect={setSelectedJobId}
          onPageChange={jobsState.setPage}
        />
      </div>
    </div>
  );
}
