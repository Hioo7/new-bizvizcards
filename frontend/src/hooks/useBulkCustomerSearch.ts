import { useEffect, useState } from "react";
import { listCustomers } from "@services/customerService";
import type { Customer } from "@app-types/customer";
import {
  BULK_CUSTOMER_PICKER_PAGE_SIZE,
  BULK_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS,
} from "@config/customerSearch.config";

export interface UseBulkCustomerSearchResult {
  search: string;
  setSearch: (value: string) => void;
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Search for the bulk multi-select picker — a larger result batch than the
 * single-select CustomerPickerField's useCustomerSearch, since bulk-add is
 * meant to let an admin search a domain (e.g. "gmail.com") and select many
 * results from one batch rather than browsing a short top-10 list.
 */
export function useBulkCustomerSearch(): UseBulkCustomerSearchResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search.trim()),
      BULK_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS,
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
          pageSize: BULK_CUSTOMER_PICKER_PAGE_SIZE,
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
