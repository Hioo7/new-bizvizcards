import { useCallback, useEffect, useState } from "react";
import { listStaff } from "@services/staffManagementService";
import type { AssignableStaffRole, StaffMember } from "@app-types/staffAuth";
import {
  STAFF_LIST_PAGE_SIZE,
  STAFF_SEARCH_DEBOUNCE_MS,
} from "@features/staff-management/config";

export interface UseStaffListResult {
  staff: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  roleFilter: AssignableStaffRole | undefined;
  isLoading: boolean;
  error: string | null;
  setSearch: (value: string) => void;
  setRoleFilter: (value: AssignableStaffRole | undefined) => void;
  setPage: (value: number) => void;
  refetch: () => void;
}

export function useStaffList(): UseStaffListResult {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilterState] = useState<
    AssignableStaffRole | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, STAFF_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchStaff() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listStaff({
          search: debouncedSearch || undefined,
          role: roleFilter,
          page,
          pageSize: STAFF_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setStaff(response.staff);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load staff.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchStaff();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, roleFilter, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  const setRoleFilter = useCallback(
    (value: AssignableStaffRole | undefined) => {
      setRoleFilterState(value);
      setPage(1);
    },
    [],
  );

  return {
    staff,
    total,
    page,
    pageSize: STAFF_LIST_PAGE_SIZE,
    search,
    roleFilter,
    isLoading,
    error,
    setSearch,
    setRoleFilter,
    setPage,
    refetch,
  };
}
