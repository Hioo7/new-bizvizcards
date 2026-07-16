import { useEffect, useState } from "react";
import { listPlans } from "@services/planService";
import type { PlanSummary } from "@app-types/plan";
import { PLAN_MGMT_SEARCH_DEBOUNCE_MS } from "@features/plans/config";

const PLAN_OPTIONS_PAGE_SIZE = 50;

export interface UsePlanOptionsResult {
  plans: PlanSummary[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function usePlanOptions(): UsePlanOptionsResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
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
          page: 1,
          pageSize: PLAN_OPTIONS_PAGE_SIZE,
        });
        if (!cancelled) setPlans(response.plans);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plans.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchPlans();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return { plans, search, setSearch, isLoading, error };
}
