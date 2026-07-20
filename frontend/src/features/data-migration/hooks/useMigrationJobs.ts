import { useCallback, useEffect, useState } from "react";
import {
  listMigrationJobs,
  startMigrationJob,
} from "../services/dataMigrationService";
import type { MigrationJob } from "../types";
import {
  MIGRATION_JOB_POLL_INTERVAL_MS,
  MIGRATION_JOBS_LIST_PAGE_SIZE,
  MIGRATION_TERMINAL_JOB_STATUSES,
} from "../config";

export interface UseMigrationJobsResult {
  jobs: MigrationJob[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refetch: () => void;
  start: () => Promise<MigrationJob>;
  isStarting: boolean;
  startError: string | null;
}

export function useMigrationJobs(): UseMigrationJobsResult {
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let isFirstFetch = true;

    async function fetchJobs() {
      if (isFirstFetch) {
        setIsLoading(true);
        isFirstFetch = false;
      }
      setError(null);
      try {
        const response = await listMigrationJobs({
          page,
          pageSize: MIGRATION_JOBS_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setJobs(response.items);
        setTotal(response.total);
        // Keeps this page's rows live while any job on it is still
        // PENDING/RUNNING, so a job that completes doesn't leave a stale
        // "Running" row behind until the admin manually navigates/refetches.
        const hasActiveJob = response.items.some(
          (job) => !MIGRATION_TERMINAL_JOB_STATUSES.includes(job.status),
        );
        if (hasActiveJob) {
          timeoutId = setTimeout(
            () => void fetchJobs(),
            MIGRATION_JOB_POLL_INTERVAL_MS,
          );
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load migration jobs.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchJobs();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  const start = useCallback(async (): Promise<MigrationJob> => {
    setIsStarting(true);
    setStartError(null);
    try {
      const job = await startMigrationJob();
      refetch();
      return job;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start migration.";
      setStartError(message);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, [refetch]);

  return {
    jobs,
    total,
    page,
    pageSize: MIGRATION_JOBS_LIST_PAGE_SIZE,
    isLoading,
    error,
    setPage,
    refetch,
    start,
    isStarting,
    startError,
  };
}
