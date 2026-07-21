import { useCustomerList } from "@hooks/useCustomerList";
import type { UseCustomerListResult } from "@hooks/useCustomerList";
import {
  BULK_CUSTOMER_PICKER_PAGE_SIZE,
  BULK_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS,
} from "@config/customerSearch.config";

export type UseBulkCustomerSearchResult = UseCustomerListResult;

/**
 * Search for the bulk multi-select picker — a larger page size than the
 * single-select CustomerPickerField's useCustomerSearch, since bulk-add is
 * meant to let an admin search a domain (e.g. "gmail.com") and select many
 * results, paginating through the full match set rather than being capped
 * to one batch.
 */
export function useBulkCustomerSearch(): UseBulkCustomerSearchResult {
  return useCustomerList({
    pageSize: BULK_CUSTOMER_PICKER_PAGE_SIZE,
    debounceMs: BULK_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS,
  });
}
