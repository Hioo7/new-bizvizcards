import type { Order } from "@app-types/order.types";
import OrderStatusBadge from "@features/order-management/components/OrderStatusBadge";

interface OrderCardProps {
  order: Order;
  onOpen: () => void;
}

export default function OrderCard({ order, onOpen }: OrderCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="flex w-full cursor-pointer flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-base-content">{order.buyerName}</p>
          <p className="truncate text-xs text-base-content/50">{order.buyerEmail}</p>
        </div>
        <p className="shrink-0 font-semibold text-base-content">₹{order.totalAmount}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <OrderStatusBadge status={order.status} />
        <p className="text-xs text-base-content/50">
          {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
          {new Date(order.placedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
