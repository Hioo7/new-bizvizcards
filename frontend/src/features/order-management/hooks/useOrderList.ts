import { useCallback, useEffect, useState } from "react";
import { listOrders } from "@services/orderService";
import type { Order, OrderStatus } from "@app-types/order.types";
import { ORDER_LIST_PAGE_SIZE } from "@features/order-management/config/orderManagement.config";

export interface UseOrderListResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter: OrderStatus | undefined;
  isLoading: boolean;
  error: string | null;
  setStatusFilter: (value: OrderStatus | undefined) => void;
  setPage: (value: number) => void;
  refetch: () => void;
}

export function useOrderList(): UseOrderListResult {
  const [statusFilter, setStatusFilterState] = useState<OrderStatus | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listOrders({
          status: statusFilter,
          page,
          pageSize: ORDER_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setOrders(response.orders);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load orders.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  const setStatusFilter = useCallback((value: OrderStatus | undefined) => {
    setStatusFilterState(value);
    setPage(1);
  }, []);

  return {
    orders,
    total,
    page,
    pageSize: ORDER_LIST_PAGE_SIZE,
    statusFilter,
    isLoading,
    error,
    setStatusFilter,
    setPage,
    refetch,
  };
}
