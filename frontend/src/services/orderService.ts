import { EMPLOYEE_ORDERS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  ListOrdersQuery,
  Order,
  OrderListResponse,
  UpdateOrderStatusPayload,
} from "@app-types/order.types";

export function listOrders(query: ListOrdersQuery): Promise<OrderListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.status) params.set("status", query.status);
  if (query.customerId) params.set("customerId", query.customerId);

  return apiRequest<OrderListResponse>(
    `${EMPLOYEE_ORDERS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getOrder(id: string): Promise<Order> {
  return apiRequest<Order>(`${EMPLOYEE_ORDERS_BASE_PATH}/${id}`, {
    method: "GET",
  });
}

export function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<Order> {
  return apiRequest<Order>(`${EMPLOYEE_ORDERS_BASE_PATH}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
