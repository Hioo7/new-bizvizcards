import { useCallback, useEffect, useState } from "react";
import { listPlans } from "@services/planService";
import type { PlanSummary } from "@app-types/plan";
import {
  PLAN_MGMT_LIST_PAGE_SIZE,
  PLAN_MGMT_SEARCH_DEBOUNCE_MS,
} from "@features/plans/config";

export interface UsePlanManagementListResult {
  plans: PlanSummary[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  isLoading: boolean;
  error: string | null;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
  refetch: () => void;
}

export function usePlanManagementList(): UsePlanManagementListResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, PLAN_MGMT_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlans() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listPlans({
          search: debouncedSearch || undefined,
          page,
          pageSize: PLAN_MGMT_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setPlans(response.plans);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load plans.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchPlans();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return {
    plans,
    total,
    page,
    pageSize: PLAN_MGMT_LIST_PAGE_SIZE,
    search,
    isLoading,
    error,
    setSearch,
    setPage,
    refetch,
  };
}
