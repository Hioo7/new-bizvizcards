import type { OrderStatus } from "@app-types/order.types";
import { ORDER_STATUS_FILTER_OPTIONS } from "@features/order-management/config/orderManagement.config";

interface OrderToolbarProps {
  statusFilter: OrderStatus | undefined;
  onStatusFilterChange: (value: OrderStatus | undefined) => void;
}

export default function OrderToolbar({
  statusFilter,
  onStatusFilterChange,
}: OrderToolbarProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max overflow-hidden rounded-field border border-base-300 sm:w-full">
        {ORDER_STATUS_FILTER_OPTIONS.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onStatusFilterChange(option.value)}
            className={`min-h-11 flex-1 whitespace-nowrap border-base-300 px-4 text-xs font-semibold transition-colors ${
              index > 0 ? "border-l" : ""
            } ${
              statusFilter === option.value
                ? "bg-primary text-primary-content"
                : "bg-base-100 text-base-content/70 hover:bg-base-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
