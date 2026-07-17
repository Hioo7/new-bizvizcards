import type { OrderStatus } from "@app-types/order.types";

export const ORDER_LIST_PAGE_SIZE = 20;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export type OrderStatusTone = "info" | "primary" | "warning" | "success" | "error" | "neutral";

export const ORDER_STATUS_TONES: Record<OrderStatus, OrderStatusTone> = {
  PLACED: "info",
  CONFIRMED: "primary",
  PROCESSING: "warning",
  SHIPPED: "warning",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "neutral",
};

export const ORDER_STATUS_FILTER_OPTIONS: { label: string; value: OrderStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Placed", value: "PLACED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

// Mirrors backend ORDER_STATUS_TRANSITIONS (orders.constants.ts) — governs
// which "change status" actions are offered for a given current status.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const ORDER_DESTRUCTIVE_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];
