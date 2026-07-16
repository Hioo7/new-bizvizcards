import { useCallback, useEffect, useState } from "react";
import { listEvents } from "@services/businessEventService";
import type { EventSummary } from "@app-types/businessEvent";
import {
  EVENT_MGMT_LIST_PAGE_SIZE,
  EVENT_MGMT_SEARCH_DEBOUNCE_MS,
} from "@features/business-events/config";

export interface UseEventManagementListResult {
  events: EventSummary[];
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

export function useEventManagementList(): UseEventManagementListResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, EVENT_MGMT_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listEvents({
          search: debouncedSearch || undefined,
          page,
          pageSize: EVENT_MGMT_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setEvents(response.events);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load events.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return {
    events,
    total,
    page,
    pageSize: EVENT_MGMT_LIST_PAGE_SIZE,
    search,
    isLoading,
    error,
    setSearch,
    setPage,
    refetch,
  };
}
