import { Plus, Search } from "lucide-react";
import type { AssignableStaffRole } from "@app-types/staffAuth";
import { STAFF_ROLE_FILTER_OPTIONS } from "@features/staff-management/config";

interface StaffToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: AssignableStaffRole | undefined;
  onRoleFilterChange: (value: AssignableStaffRole | undefined) => void;
  canAddStaff: boolean;
  onAddStaff: () => void;
}

export default function StaffToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  canAddStaff,
  onAddStaff,
}: StaffToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search staff"
            className="w-full min-h-11 rounded-field border border-base-300 bg-base-100 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:outline-none sm:w-64"
          />
        </div>

        <div className="flex overflow-hidden rounded-field border border-base-300">
          {STAFF_ROLE_FILTER_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onRoleFilterChange(option.value)}
              className={`min-h-11 flex-1 border-base-300 px-4 text-xs font-semibold transition-colors ${
                index > 0 ? "border-l" : ""
              } ${
                roleFilter === option.value
                  ? "bg-primary text-primary-content"
                  : "bg-base-100 text-base-content/70 hover:bg-base-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {canAddStaff && (
        <button
          type="button"
          aria-label="Add staff"
          onClick={onAddStaff}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
