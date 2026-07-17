import { useMemo } from "react";
import { updateOrderStatus } from "@services/orderService";
import type { Order, OrderStatus } from "@app-types/order.types";

export interface UseOrderDetailMutationsResult {
  updateStatus: (orderId: string, status: OrderStatus) => Promise<Order>;
}

export function useOrderDetailMutations(
  refetch: () => void,
): UseOrderDetailMutationsResult {
  return useMemo(
    () => ({
      updateStatus: async (orderId, status) => {
        const order = await updateOrderStatus(orderId, { status });
        refetch();
        return order;
      },
    }),
    [refetch],
  );
}
