import { useCallback, useEffect, useState } from "react";
import { listOrganisations } from "@services/organisationService";
import type { OrganisationSummary } from "@app-types/organisation";
import {
  ORGANISATION_MGMT_LIST_PAGE_SIZE,
  ORGANISATION_MGMT_SEARCH_DEBOUNCE_MS,
} from "@features/customer-organisation-management/config";

export interface UseOrganisationManagementListResult {
  organisations: OrganisationSummary[];
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

export function useOrganisationManagementList(): UseOrganisationManagementListResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [organisations, setOrganisations] = useState<OrganisationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, ORGANISATION_MGMT_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrganisations() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listOrganisations({
          search: debouncedSearch || undefined,
          page,
          pageSize: ORGANISATION_MGMT_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setOrganisations(response.organisations);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load organisations.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchOrganisations();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return {
    organisations,
    total,
    page,
    pageSize: ORGANISATION_MGMT_LIST_PAGE_SIZE,
    search,
    isLoading,
    error,
    setSearch,
    setPage,
    refetch,
  };
}
