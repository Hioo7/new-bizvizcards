import { OrderStatus } from '../../generated/prisma/client';
import { ORDER_STATUS_TRANSITIONS } from './orders.constants';

describe('ORDER_STATUS_TRANSITIONS', () => {
  it('defines a transition list for every OrderStatus value', () => {
    for (const status of Object.values(OrderStatus)) {
      expect(ORDER_STATUS_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('allows the documented happy path through to DELIVERED then REFUNDED', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PLACED]).toContain(
      OrderStatus.CONFIRMED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CONFIRMED]).toContain(
      OrderStatus.PROCESSING,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PROCESSING]).toContain(
      OrderStatus.SHIPPED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.SHIPPED]).toContain(
      OrderStatus.DELIVERED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.DELIVERED]).toContain(
      OrderStatus.REFUNDED,
    );
  });

  it('allows cancellation up through PROCESSING but not once SHIPPED', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PLACED]).toContain(
      OrderStatus.CANCELLED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CONFIRMED]).toContain(
      OrderStatus.CANCELLED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PROCESSING]).toContain(
      OrderStatus.CANCELLED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.SHIPPED]).not.toContain(
      OrderStatus.CANCELLED,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.DELIVERED]).not.toContain(
      OrderStatus.CANCELLED,
    );
  });

  it('has no outgoing transitions from either terminal state', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CANCELLED]).toHaveLength(0);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.REFUNDED]).toHaveLength(0);
  });
});
