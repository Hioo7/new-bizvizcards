import { Ban, CircleCheck, Pencil, Trash2 } from "lucide-react";
import type { StaffMember } from "@app-types/staffAuth";
import StaffRoleBadge from "@components/StaffRoleBadge";
import BannedStatusBadge from "@components/BannedStatusBadge";
import StaffAvatar from "@components/StaffAvatar";
import type { StaffRowActions } from "@features/staff-management/utils/getStaffRowActions";

interface StaffCardProps {
  staff: StaffMember;
  actions: StaffRowActions;
  onEdit: () => void;
  onBanToggle: () => void;
  onDelete: () => void;
}

export default function StaffCard({
  staff,
  actions,
  onEdit,
  onBanToggle,
  onDelete,
}: StaffCardProps) {
  const hasAnyAction = actions.canEdit || actions.canToggleBan || actions.canDelete;

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-3">
        <StaffAvatar role={staff.role} />
        <div>
          <p className="font-semibold text-base-content">{staff.name}</p>
          <p className="text-xs text-base-content/60">{staff.email}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StaffRoleBadge role={staff.role} />
        <BannedStatusBadge banned={staff.banned} />
      </div>

      {hasAnyAction && (
        <div className="mt-3 flex items-center gap-2 border-t border-base-300 pt-3">
          {actions.canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-field border border-base-300 text-sm text-base-content/70"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
          {actions.canToggleBan && (
            <button
              type="button"
              onClick={onBanToggle}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-field border border-base-300 text-sm text-base-content/70"
            >
              {staff.banned ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              {staff.banned ? "Unban" : "Ban"}
            </button>
          )}
          {actions.canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${staff.name}`}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
