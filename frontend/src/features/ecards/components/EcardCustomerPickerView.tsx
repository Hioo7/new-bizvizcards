import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomerList } from "@hooks/useCustomerList";
import Pagination from "@components/Pagination";
import { adminCustomerEcardsPath } from "@config/routes";
import {
  ECARD_CUSTOMER_PICKER_PAGE_SIZE,
  ECARD_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS,
} from "@features/ecards/config/ecardCustomerPicker.config";

export default function EcardCustomerPickerView() {
  const navigate = useNavigate();
  const {
    search,
    setSearch,
    customers,
    isLoading,
    page,
    pageSize,
    total,
    setPage,
  } = useCustomerList({
    pageSize: ECARD_CUSTOMER_PICKER_PAGE_SIZE,
    debounceMs: ECARD_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">E-cards</h1>
        <p className="text-sm text-base-content/60">
          Pick a customer to view or build their e-card.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers by name or email"
          className="w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </div>

      {isLoading && <p className="text-sm text-base-content/50">Searching…</p>}
      {!isLoading && customers.length === 0 && (
        <p className="rounded-box border border-dashed border-base-300 px-4 py-10 text-center text-sm text-base-content/50">
          No customers found.
        </p>
      )}

      {customers.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() =>
                navigate(adminCustomerEcardsPath(customer.id), {
                  state: { customer },
                })
              }
              className="flex w-full items-center gap-3 border-b border-base-300 px-4 py-3 text-left last:border-b-0 hover:bg-base-200"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-300 text-base-content/60">
                {customer.pfpUrl ? (
                  <img src={customer.pfpUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-base-content">
                  {customer.name}
                </p>
                <p className="truncate text-xs text-base-content/50">{customer.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
