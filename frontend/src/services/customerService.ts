import { CUSTOMERS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  BanCustomerPayload,
  Customer,
  CustomerListResponse,
  CreateCustomerPayload,
  ListCustomersQuery,
  SetCustomerPasswordPayload,
  UpdateCustomerPayload,
} from "@app-types/customer";

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

export function createCustomer(
  payload: CreateCustomerPayload,
): Promise<Customer> {
  return apiRequest<Customer>(CUSTOMERS_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomer(
  id: string,
  payload: UpdateCustomerPayload,
): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_BASE_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setCustomerPassword(
  id: string,
  payload: SetCustomerPasswordPayload,
): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_BASE_PATH}/${id}/set-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function banCustomer(
  id: string,
  payload: BanCustomerPayload,
): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_BASE_PATH}/${id}/ban`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function unbanCustomer(id: string): Promise<Customer> {
  return apiRequest<Customer>(`${CUSTOMERS_BASE_PATH}/${id}/unban`, {
    method: "POST",
  });
}
