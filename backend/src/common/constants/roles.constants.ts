import { ForbiddenException } from '@nestjs/common';

export const EMPLOYEE_ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLE)[keyof typeof EMPLOYEE_ROLE];

const EMPLOYEE_ROLE_VALUES: readonly string[] = Object.values(EMPLOYEE_ROLE);

/**
 * Narrows an EmployeeAccount's nullable `role` column to EmployeeRole.
 * Every authenticated employee session has a role (set at creation via
 * betterAuth's defaultRole) — a missing/unrecognized role here means the
 * account is in an invalid state, so this denies access rather than guess.
 */
export function requireEmployeeRole(
  role: string | null | undefined,
): EmployeeRole {
  if (!role || !EMPLOYEE_ROLE_VALUES.includes(role)) {
    throw new ForbiddenException();
  }
  return role as EmployeeRole;
}
