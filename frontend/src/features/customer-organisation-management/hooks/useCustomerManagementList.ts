import { useCustomerList } from "@hooks/useCustomerList";
import type { UseCustomerListResult } from "@hooks/useCustomerList";
import {
  CUSTOMER_MGMT_LIST_PAGE_SIZE,
  CUSTOMER_MGMT_SEARCH_DEBOUNCE_MS,
} from "@features/customer-organisation-management/config";

export type UseCustomerManagementListResult = UseCustomerListResult;

export function useCustomerManagementList(): UseCustomerManagementListResult {
  return useCustomerList({
    pageSize: CUSTOMER_MGMT_LIST_PAGE_SIZE,
    debounceMs: CUSTOMER_MGMT_SEARCH_DEBOUNCE_MS,
  });
}
