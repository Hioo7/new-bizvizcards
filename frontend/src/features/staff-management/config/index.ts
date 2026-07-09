import type { AssignableStaffRole } from "@app-types/staffAuth";

export const STAFF_LIST_PAGE_SIZE = 20;
export const STAFF_SEARCH_DEBOUNCE_MS = 350;
export const STAFF_NAME_MAX_LENGTH = 120;
export const STAFF_BAN_REASON_MAX_LENGTH = 500;

export const STAFF_ROLE_FILTER_OPTIONS: {
  value: AssignableStaffRole | undefined;
  label: string;
}[] = [
  { value: undefined, label: "All" },
  { value: "employee", label: "Employees" },
  { value: "admin", label: "Admins" },
];

export const STAFF_ASSIGNABLE_ROLE_OPTIONS: {
  value: AssignableStaffRole;
  label: string;
}[] = [
  { value: "employee", label: "Employee" },
  { value: "admin", label: "Admin" },
];
