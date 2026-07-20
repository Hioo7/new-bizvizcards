import { useCallback, useEffect, useState } from "react";
import { listMigrationRecords } from "../services/dataMigrationService";
import type {
  MigrationDomain,
  MigrationRecord,
  MigrationRecordStatus,
} from "../types";
import { MIGRATION_RECORDS_LIST_PAGE_SIZE } from "../config";

export interface UseMigrationRecordsResult {
  records: MigrationRecord[];
  total: number;
  page: number;
  pageSize: number;
  domainFilter: MigrationDomain | undefined;
  statusFilter: MigrationRecordStatus | undefined;
  reasonFilter: string;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setDomainFilter: (domain: MigrationDomain | undefined) => void;
  setStatusFilter: (status: MigrationRecordStatus | undefined) => void;
  setReasonFilter: (reason: string) => void;
  refetch: () => void;
}

export function useMigrationRecords(
  jobId: string | null,
): UseMigrationRecordsResult {
  const [records, setRecords] = useState<MigrationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [domainFilter, setDomainFilterState] = useState<
    MigrationDomain | undefined
  >(undefined);
  const [statusFilter, setStatusFilterState] = useState<
    MigrationRecordStatus | undefined
  >(undefined);
  const [reasonFilter, setReasonFilterState] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;

    async function fetchRecords(currentJobId: string) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listMigrationRecords(currentJobId, {
          domain: domainFilter,
          status: statusFilter,
          reason: reasonFilter || undefined,
          page,
          pageSize: MIGRATION_RECORDS_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setRecords(response.items);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load migration results.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchRecords(jobId);

    return () => {
      cancelled = true;
    };
  }, [jobId, domainFilter, statusFilter, reasonFilter, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  const setDomainFilter = useCallback(
    (value: MigrationDomain | undefined) => {
      setDomainFilterState(value);
      setPage(1);
    },
    [],
  );

  const setStatusFilter = useCallback(
    (value: MigrationRecordStatus | undefined) => {
      setStatusFilterState(value);
      setPage(1);
    },
    [],
  );

  const setReasonFilter = useCallback((value: string) => {
    setReasonFilterState(value);
    setPage(1);
  }, []);

  return {
    records: jobId ? records : [],
    total: jobId ? total : 0,
    page,
    pageSize: MIGRATION_RECORDS_LIST_PAGE_SIZE,
    domainFilter,
    statusFilter,
    reasonFilter,
    isLoading: jobId ? isLoading : false,
    error,
    setPage,
    setDomainFilter,
    setStatusFilter,
    setReasonFilter,
    refetch,
  };
}
