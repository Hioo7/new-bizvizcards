export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderShippingAddress {
  label: string;
  contactName: string;
  contactPhoneCountryDialCode: string;
  contactPhoneNumber: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByEmployeeName: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  buyerName: string;
  buyerEmail: string;
  shippingAddress: OrderShippingAddress;
  items: OrderItem[];
  totalAmount: number;
  statusHistory: OrderStatusHistoryEntry[];
  placedAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListOrdersQuery {
  status?: OrderStatus;
  customerId?: string;
  page: number;
  pageSize: number;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}
