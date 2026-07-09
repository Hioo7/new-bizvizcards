import { CUSTOMERS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { CustomerListResponse, ListCustomersQuery } from "@app-types/customer";

export function listCustomers(
  query: ListCustomersQuery,
): Promise<CustomerListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<CustomerListResponse>(
    `${CUSTOMERS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}
