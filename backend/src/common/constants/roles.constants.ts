export const EMPLOYEE_ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLE)[keyof typeof EMPLOYEE_ROLE];
