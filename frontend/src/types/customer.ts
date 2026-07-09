export interface Customer {
  id: string;
  name: string;
  email: string;
  pfpUrl: string | null;
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
