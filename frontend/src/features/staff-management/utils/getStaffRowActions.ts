import type { StaffMember, StaffUser } from "@app-types/staffAuth";

export interface StaffRowActions {
  canEdit: boolean;
  canChangeRole: boolean;
  canToggleBan: boolean;
  canDelete: boolean;
}

const NO_ACTIONS: StaffRowActions = {
  canEdit: false,
  canChangeRole: false,
  canToggleBan: false,
  canDelete: false,
};

/**
 * UI-only mirror of the backend's target-role business rules, used to decide
 * which action buttons render per row. The backend service layer remains the
 * real enforcement authority — this just avoids showing controls that would
 * be rejected anyway.
 */
export function getStaffRowActions(
  viewer: StaffUser,
  target: StaffMember,
): StaffRowActions {
  if (target.role === "super_admin") return NO_ACTIONS;
  if (viewer.role === "employee" || viewer.role === null) return NO_ACTIONS;

  const isSelf = target.id === viewer.id;

  if (viewer.role === "admin") {
    const targetIsEmployee = target.role === "employee";
    return {
      canEdit: targetIsEmployee,
      canChangeRole: false,
      canToggleBan: targetIsEmployee && !isSelf,
      canDelete: targetIsEmployee && !isSelf,
    };
  }

  return {
    canEdit: true,
    canChangeRole: !isSelf,
    canToggleBan: !isSelf,
    canDelete: !isSelf,
  };
}
