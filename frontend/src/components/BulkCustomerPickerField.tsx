import { Search, User } from "lucide-react";
import { useBulkCustomerSearch } from "@hooks/useBulkCustomerSearch";
import Pagination from "@components/Pagination";
import type { Customer } from "@app-types/customer";

interface BulkCustomerPickerFieldProps {
  label: string;
  selectedCustomers: Customer[];
  onSelectionChange: (customers: Customer[]) => void;
  /** Customer ids to hide from search results (e.g. existing org members). */
  excludeCustomerIds?: string[];
  error?: string;
}

export default function BulkCustomerPickerField({
  label,
  selectedCustomers,
  onSelectionChange,
  excludeCustomerIds = [],
  error,
}: BulkCustomerPickerFieldProps) {
  const {
    search,
    setSearch,
    customers,
    isLoading,
    page,
    pageSize,
    total,
    setPage,
  } = useBulkCustomerSearch();

  const excludeSet = new Set(excludeCustomerIds);
  const results = customers.filter((c) => !excludeSet.has(c.id));
  const selectedIds = new Set(selectedCustomers.map((c) => c.id));
  const allVisibleSelected =
    results.length > 0 && results.every((c) => selectedIds.has(c.id));

  function toggleOne(customer: Customer) {
    if (selectedIds.has(customer.id)) {
      onSelectionChange(selectedCustomers.filter((c) => c.id !== customer.id));
    } else {
      onSelectionChange([...selectedCustomers, customer]);
    }
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(results.map((c) => c.id));
      onSelectionChange(
        selectedCustomers.filter((c) => !visibleIds.has(c.id)),
      );
    } else {
      const merged = new Map(selectedCustomers.map((c) => [c.id, c]));
      for (const customer of results) merged.set(customer.id, customer);
      onSelectionChange([...merged.values()]);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-base-content/70">
          {label} <span className="text-error">*</span>
        </p>
        {selectedCustomers.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectionChange([])}
            className="text-xs text-base-content/50 hover:text-base-content"
          >
            Clear ({selectedCustomers.length} selected)
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, or domain"
          className="w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </div>

      {!isLoading && results.length > 0 && (
        <label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2 rounded-t-field border border-b-0 border-base-300 bg-base-200 px-3 text-xs font-medium text-base-content/70">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleSelectAllVisible}
            className="checkbox checkbox-sm checkbox-primary"
          />
          Select all ({results.length})
        </label>
      )}

      <div
        className={`max-h-60 overflow-y-auto border border-base-300 ${
          !isLoading && results.length > 0 ? "rounded-b-field" : "mt-2 rounded-field"
        }`}
      >
        {isLoading && (
          <p className="px-3 py-3 text-sm text-base-content/50">Searching…</p>
        )}
        {!isLoading && results.length === 0 && (
          <p className="px-3 py-3 text-sm text-base-content/50">
            No customers found.
          </p>
        )}
        {!isLoading &&
          results.map((customer) => (
            <label
              key={customer.id}
              className={`flex cursor-pointer items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0 hover:bg-base-200 ${
                selectedIds.has(customer.id) ? "bg-primary/5" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(customer.id)}
                onChange={() => toggleOne(customer)}
                className="checkbox checkbox-sm checkbox-primary shrink-0"
              />
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
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-base-content">
                  {customer.name}
                </span>
                <span className="block truncate text-xs text-base-content/50">
                  {customer.email}
                </span>
              </span>
              {customer.currentPlan && (
                <span className="shrink-0 truncate rounded-full bg-base-300 px-2 py-1 text-[10px] font-medium text-base-content/60">
                  {customer.currentPlan.name}
                </span>
              )}
            </label>
          ))}
      </div>

      <div className="mt-1">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
