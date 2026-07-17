import { ShoppingBag } from "lucide-react";
import type { Order } from "@app-types/order.types";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import OrderRow from "@features/order-management/components/OrderRow";
import OrderCard from "@features/order-management/components/OrderCard";

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onOpen: (order: Order) => void;
}

export default function OrderTable({
  orders,
  isLoading,
  error,
  hasActiveFilters,
  onOpen,
}: OrderTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <ShoppingBag className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters ? "No orders match your filters." : "No orders yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
            <th className="py-2 pl-4 pr-3 font-semibold">Buyer</th>
            <th className="px-3 py-2 font-semibold">Items</th>
            <th className="px-3 py-2 font-semibold">Total</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="py-2 pl-3 pr-4 text-right font-semibold">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onOpen={() => onOpen(order)} />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onOpen={() => onOpen(order)} />
        ))}
      </div>
    </>
  );
}
