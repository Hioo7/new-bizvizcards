import { Search } from "lucide-react";
import { usePlanOptions } from "@features/plans/hooks/usePlanOptions";

interface PlanPickerProps {
  value: string;
  onChange: (planId: string) => void;
  excludePlanId?: string;
}

export default function PlanPicker({
  value,
  onChange,
  excludePlanId,
}: PlanPickerProps) {
  const { plans, search, setSearch, isLoading, error } = usePlanOptions();
  const options = plans.filter((plan) => plan.id !== excludePlanId);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search plans"
          aria-label="Search plans"
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
        className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
      >
        <option value="">Select a plan…</option>
        {options.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </select>
    </div>
  );
}
