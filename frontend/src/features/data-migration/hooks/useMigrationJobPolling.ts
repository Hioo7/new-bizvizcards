import { useEffect, useState } from "react";
import { getMigrationJob } from "../services/dataMigrationService";
import type { MigrationJob } from "../types";
import {
  MIGRATION_JOB_POLL_INTERVAL_MS,
  MIGRATION_TERMINAL_JOB_STATUSES,
} from "../config";

export interface UseMigrationJobPollingResult {
  job: MigrationJob | null;
  isLoading: boolean;
  error: string | null;
}

/** Polls a single job's status every MIGRATION_JOB_POLL_INTERVAL_MS while
 * it's PENDING/RUNNING, matching legacy's own migration-progress polling
 * cadence — stops automatically once the job reaches a terminal status. */
export function useMigrationJobPolling(
  jobId: string | null,
): UseMigrationJobPollingResult {
  const [job, setJob] = useState<MigrationJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let isFirstPoll = true;

    async function poll(currentJobId: string) {
      if (isFirstPoll) {
        setIsLoading(true);
        isFirstPoll = false;
      }
      try {
        const result = await getMigrationJob(currentJobId);
        if (cancelled) return;
        setJob(result);
        setError(null);
        if (!MIGRATION_TERMINAL_JOB_STATUSES.includes(result.status)) {
          timeoutId = setTimeout(
            () => void poll(currentJobId),
            MIGRATION_JOB_POLL_INTERVAL_MS,
          );
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load migration job status.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void poll(jobId);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId]);

  return {
    job: jobId ? job : null,
    isLoading: jobId ? isLoading : false,
    error,
  };
}
