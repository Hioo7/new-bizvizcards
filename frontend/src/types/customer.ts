export interface Customer {
  id: string;
  name: string;
  email: string;
  pfpUrl: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  currentPlan: { id: string; name: string } | null;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListCustomersQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  email?: string;
}

export interface SetCustomerPasswordPayload {
  newPassword: string;
}

export interface BanCustomerPayload {
  banReason?: string;
}
