import type { StaffRole } from "@app-types/staffAuth";

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  employee: "Employee",
  admin: "Admin",
  super_admin: "Super Admin",
};
