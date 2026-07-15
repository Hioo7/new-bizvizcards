import type { StaffRole } from "@app-types/staffAuth";

export function isAdminTier(role: StaffRole | null): boolean {
  return role === "admin" || role === "super_admin";
}
