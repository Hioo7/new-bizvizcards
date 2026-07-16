import { Plus, Search } from "lucide-react";

interface PlanToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddPlan: () => void;
}

export default function PlanToolbar({
  search,
  onSearchChange,
  onAddPlan,
}: PlanToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by plan name"
          aria-label="Search plans"
          className="w-full min-h-11 rounded-field border border-base-300 bg-base-100 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:outline-none sm:w-64"
        />
      </div>

      <button
        type="button"
        aria-label="Add plan"
        onClick={onAddPlan}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
