import { useCustomerList } from "@hooks/useCustomerList";
import type { UseCustomerListResult } from "@hooks/useCustomerList";
import {
  CUSTOMER_SEARCH_DEBOUNCE_MS,
  CUSTOMER_SEARCH_PAGE_SIZE,
} from "@config/customerSearch.config";

export type UseCustomerSearchResult = UseCustomerListResult;

/** Search + pagination for the single-select CustomerPickerField — a smaller
 * page size than useBulkCustomerSearch, since single-select only needs
 * enough rows to browse and pick one. */
export function useCustomerSearch(): UseCustomerSearchResult {
  return useCustomerList({
    pageSize: CUSTOMER_SEARCH_PAGE_SIZE,
    debounceMs: CUSTOMER_SEARCH_DEBOUNCE_MS,
  });
}
