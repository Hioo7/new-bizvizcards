import { useCallback, useEffect, useState } from "react";
import { getOrder } from "@services/orderService";
import type { Order } from "@app-types/order.types";

export interface UseOrderDetailResult {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrderDetail(orderId: string): UseOrderDetailResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getOrder(orderId);
        if (cancelled) return;
        setOrder(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load order.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { order, isLoading, error, refetch };
}
