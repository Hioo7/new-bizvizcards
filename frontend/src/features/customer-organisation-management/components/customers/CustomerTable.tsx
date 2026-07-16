import { Users } from "lucide-react";
import type { Customer } from "@app-types/customer";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import CustomerRow from "@features/customer-organisation-management/components/customers/CustomerRow";
import CustomerCard from "@features/customer-organisation-management/components/customers/CustomerCard";

interface CustomerTableProps {
  customers: Customer[];
  canBan: boolean;
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (customer: Customer) => void;
  onSetPassword: (customer: Customer) => void;
  onBanToggle: (customer: Customer) => void;
  onManageEcards: (customer: Customer) => void;
  onManagePlan: (customer: Customer) => void;
}

export default function CustomerTable({
  customers,
  canBan,
  isLoading,
  error,
  hasActiveFilters,
  onEdit,
  onSetPassword,
  onBanToggle,
  onManageEcards,
  onManagePlan,
}: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Users className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters
            ? "No customers match your search."
            : "No customers yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
            <th className="py-2 pl-4 pr-3 font-semibold">Customer</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="py-2 pl-3 pr-4 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              canBan={canBan}
              onEdit={() => onEdit(customer)}
              onSetPassword={() => onSetPassword(customer)}
              onBanToggle={() => onBanToggle(customer)}
              onManageEcards={() => onManageEcards(customer)}
              onManagePlan={() => onManagePlan(customer)}
            />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            canBan={canBan}
            onEdit={() => onEdit(customer)}
            onSetPassword={() => onSetPassword(customer)}
            onBanToggle={() => onBanToggle(customer)}
            onManageEcards={() => onManageEcards(customer)}
            onManagePlan={() => onManagePlan(customer)}
          />
        ))}
      </div>
    </>
  );
}
