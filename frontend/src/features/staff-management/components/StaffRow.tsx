import { Ban, CircleCheck, Pencil, Trash2 } from "lucide-react";
import type { StaffMember } from "@app-types/staffAuth";
import StaffRoleBadge from "@components/StaffRoleBadge";
import BannedStatusBadge from "@components/BannedStatusBadge";
import StaffAvatar from "@components/StaffAvatar";
import type { StaffRowActions } from "@features/staff-management/utils/getStaffRowActions";

interface StaffRowProps {
  staff: StaffMember;
  actions: StaffRowActions;
  onEdit: () => void;
  onBanToggle: () => void;
  onDelete: () => void;
}

export default function StaffRow({
  staff,
  actions,
  onEdit,
  onBanToggle,
  onDelete,
}: StaffRowProps) {
  const hasAnyAction = actions.canEdit || actions.canToggleBan || actions.canDelete;

  return (
    <tr className="border-b border-base-300 last:border-b-0 hover:bg-base-200/50">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <StaffAvatar role={staff.role} />
          <div>
            <p className="font-semibold text-base-content">{staff.name}</p>
            <p className="text-xs text-base-content/60">{staff.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <StaffRoleBadge role={staff.role} />
      </td>
      <td className="px-3 py-3">
        <BannedStatusBadge banned={staff.banned} />
      </td>
      <td className="py-3 pl-3 pr-4">
        {hasAnyAction ? (
          <div className="flex items-center justify-end gap-1">
            {actions.canEdit && (
              <button
                type="button"
                aria-label={`Edit ${staff.name}`}
                onClick={onEdit}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {actions.canToggleBan && (
              <button
                type="button"
                aria-label={staff.banned ? `Unban ${staff.name}` : `Ban ${staff.name}`}
                onClick={onBanToggle}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-warning"
              >
                {staff.banned ? (
                  <CircleCheck className="h-4 w-4" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
              </button>
            )}
            {actions.canDelete && (
              <button
                type="button"
                aria-label={`Delete ${staff.name}`}
                onClick={onDelete}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <span className="block text-right text-xs text-base-content/30">—</span>
        )}
      </td>
    </tr>
  );
}
