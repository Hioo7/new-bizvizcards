import { OrderStatus } from '../../generated/prisma/client';

// Legal stage transitions an employee can move an order through. PLACED and
// early stages can still be cancelled; once SHIPPED it's too late to cancel
// (only DELIVERED follows), and REFUNDED is only reachable from DELIVERED.
// Terminal states (CANCELLED, REFUNDED) have no outgoing transitions.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export const ORDER_LIST_DEFAULT_PAGE = 1;
export const ORDER_LIST_DEFAULT_PAGE_SIZE = 20;
export const ORDER_LIST_MAX_PAGE_SIZE = 100;
