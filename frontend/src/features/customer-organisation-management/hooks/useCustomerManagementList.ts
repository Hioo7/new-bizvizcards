import { useCallback, useEffect, useState } from "react";
import { listCustomers } from "@services/customerService";
import type { Customer } from "@app-types/customer";
import {
  CUSTOMER_MGMT_LIST_PAGE_SIZE,
  CUSTOMER_MGMT_SEARCH_DEBOUNCE_MS,
} from "@features/customer-organisation-management/config";

export interface UseCustomerManagementListResult {
  customers: Customer[];
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

export function useCustomerManagementList(): UseCustomerManagementListResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, CUSTOMER_MGMT_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCustomers() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listCustomers({
          search: debouncedSearch || undefined,
          page,
          pageSize: CUSTOMER_MGMT_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setCustomers(response.customers);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load customers.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchCustomers();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return {
    customers,
    total,
    page,
    pageSize: CUSTOMER_MGMT_LIST_PAGE_SIZE,
    search,
    isLoading,
    error,
    setSearch,
    setPage,
    refetch,
  };
}
