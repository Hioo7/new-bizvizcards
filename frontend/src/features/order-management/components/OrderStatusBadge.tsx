import type { OrderStatus } from "@app-types/order.types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  type OrderStatusTone,
} from "@features/order-management/config/orderManagement.config";

const TONE_CLASSES: Record<OrderStatusTone, string> = {
  info: "bg-info/10 text-info",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
  neutral: "bg-base-200 text-base-content/50",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-field px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[ORDER_STATUS_TONES[status]]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
