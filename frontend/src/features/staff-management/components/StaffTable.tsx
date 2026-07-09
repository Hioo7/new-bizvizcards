import { Users } from "lucide-react";
import type { StaffMember, StaffUser } from "@app-types/staffAuth";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import StaffRow from "@features/staff-management/components/StaffRow";
import StaffCard from "@features/staff-management/components/StaffCard";
import { getStaffRowActions } from "@features/staff-management/utils/getStaffRowActions";

interface StaffTableProps {
  staff: StaffMember[];
  viewer: StaffUser;
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (staff: StaffMember) => void;
  onBanToggle: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
}

export default function StaffTable({
  staff,
  viewer,
  isLoading,
  error,
  hasActiveFilters,
  onEdit,
  onBanToggle,
  onDelete,
}: StaffTableProps) {
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

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Users className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters
            ? "No staff match your search."
            : "No staff yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
            <th className="py-2 pl-4 pr-3 font-semibold">Staff</th>
            <th className="px-3 py-2 font-semibold">Role</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="py-2 pl-3 pr-4 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <StaffRow
              key={member.id}
              staff={member}
              actions={getStaffRowActions(viewer, member)}
              onEdit={() => onEdit(member)}
              onBanToggle={() => onBanToggle(member)}
              onDelete={() => onDelete(member)}
            />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {staff.map((member) => (
          <StaffCard
            key={member.id}
            staff={member}
            actions={getStaffRowActions(viewer, member)}
            onEdit={() => onEdit(member)}
            onBanToggle={() => onBanToggle(member)}
            onDelete={() => onDelete(member)}
          />
        ))}
      </div>
    </>
  );
}
