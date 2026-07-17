import { useNavigate } from "react-router-dom";
import { adminOrderDetailPath } from "@config/routes";
import { useOrderList } from "@features/order-management/hooks/useOrderList";
import OrderToolbar from "@features/order-management/components/OrderToolbar";
import OrderTable from "@features/order-management/components/OrderTable";
import Pagination from "@components/Pagination";

export default function OrderManagementApp() {
  const navigate = useNavigate();
  const list = useOrderList();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">Orders</h1>
        <p className="text-sm text-base-content/60">
          {list.total} {list.total === 1 ? "order" : "orders"}
        </p>
      </div>

      <OrderToolbar
        statusFilter={list.statusFilter}
        onStatusFilterChange={list.setStatusFilter}
      />

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <OrderTable
          orders={list.orders}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(list.statusFilter)}
          onOpen={(order) => navigate(adminOrderDetailPath(order.id))}
        />
      </div>

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />
    </div>
  );
}
