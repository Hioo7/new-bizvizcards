import type { Order } from "@app-types/order.types";
import OrderStatusBadge from "@features/order-management/components/OrderStatusBadge";

interface OrderRowProps {
  order: Order;
  onOpen: () => void;
}

export default function OrderRow({ order, onOpen }: OrderRowProps) {
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-base-300 last:border-b-0 hover:bg-base-200/50"
    >
      <td className="py-3 pl-4 pr-3">
        <p className="font-semibold text-base-content">{order.buyerName}</p>
        <p className="text-xs text-base-content/50">{order.buyerEmail}</p>
      </td>
      <td className="px-3 py-3 text-base-content/70">
        {order.items.length} {order.items.length === 1 ? "item" : "items"}
      </td>
      <td className="px-3 py-3 font-semibold text-base-content">
        ₹{order.totalAmount}
      </td>
      <td className="px-3 py-3">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="py-3 pl-3 pr-4 text-right text-xs text-base-content/50">
        {new Date(order.placedAt).toLocaleDateString()}
      </td>
    </tr>
  );
}
