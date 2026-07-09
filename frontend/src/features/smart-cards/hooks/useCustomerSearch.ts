import { useEffect, useState } from "react";
import { listCustomers } from "@services/customerService";
import type { Customer } from "@app-types/customer";
import {
  CUSTOMER_SEARCH_DEBOUNCE_MS,
  CUSTOMER_SEARCH_PAGE_SIZE,
} from "@features/smart-cards/config/smartCardForm.config";

export interface UseCustomerSearchResult {
  search: string;
  setSearch: (value: string) => void;
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
}

export function useCustomerSearch(): UseCustomerSearchResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search.trim()),
      CUSTOMER_SEARCH_DEBOUNCE_MS,
    );
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
          page: 1,
          pageSize: CUSTOMER_SEARCH_PAGE_SIZE,
        });
        if (cancelled) return;
        setCustomers(response.customers);
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
  }, [debouncedSearch]);

  return { search, setSearch, customers, isLoading, error };
}
