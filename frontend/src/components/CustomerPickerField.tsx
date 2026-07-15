import { useState } from "react";
import { Search, User, UserCheck, X } from "lucide-react";
import { useCustomerSearch } from "@hooks/useCustomerSearch";
import type { Customer } from "@app-types/customer";

interface CustomerPickerFieldProps {
  selectedCustomerId: string;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  error?: string;
  label?: string;
}

export default function CustomerPickerField({
  selectedCustomerId,
  selectedCustomer,
  onSelect,
  error,
  label = "Linked customer",
}: CustomerPickerFieldProps) {
  const [isPicking, setIsPicking] = useState(!selectedCustomerId);
  const { search, setSearch, customers, isLoading } = useCustomerSearch();

  if (!isPicking && selectedCustomerId) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-semibold text-base-content/70">
          {label}
        </p>
        <div className="flex items-center gap-3 rounded-field border border-base-300 bg-base-200 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <UserCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-base-content">
              {selectedCustomer?.name ?? "Customer linked"}
            </p>
            <p className="truncate text-xs text-base-content/50">
              {selectedCustomer?.email ?? selectedCustomerId}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPicking(true)}
            className="btn btn-sm min-h-9 rounded-field border border-base-300 bg-base-100 text-xs text-base-content hover:bg-base-200"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-base-content/70">
          {label} <span className="text-error">*</span>
        </p>
        {selectedCustomerId && (
          <button
            type="button"
            onClick={() => setIsPicking(false)}
            className="inline-flex items-center gap-1 text-xs text-base-content/50 hover:text-base-content"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        )}
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
      <div className="mt-2 max-h-52 overflow-y-auto rounded-field border border-base-300">
        {isLoading && (
          <p className="px-3 py-3 text-sm text-base-content/50">Searching…</p>
        )}
        {!isLoading && customers.length === 0 && (
          <p className="px-3 py-3 text-sm text-base-content/50">
            No customers found.
          </p>
        )}
        {!isLoading &&
          customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => {
                onSelect(customer);
                setIsPicking(false);
              }}
              className="flex w-full items-center gap-3 border-b border-base-300 px-3 py-2.5 text-left last:border-b-0 hover:bg-base-200"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-300 text-base-content/60">
                {customer.pfpUrl ? (
                  <img
                    src={customer.pfpUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-base-content">
                  {customer.name}
                </p>
                <p className="truncate text-xs text-base-content/50">
                  {customer.email}
                </p>
              </div>
            </button>
          ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
