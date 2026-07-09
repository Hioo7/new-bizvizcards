import { EMPLOYEE_ROLE } from '../../common/constants/roles.constants';

export const STAFF_LIST_DEFAULT_PAGE = 1;
export const STAFF_LIST_DEFAULT_PAGE_SIZE = 20;
export const STAFF_LIST_MAX_PAGE_SIZE = 100;

export const STAFF_NAME_MAX_LENGTH = 120;
export const STAFF_SEARCH_MAX_LENGTH = 120;
export const STAFF_BAN_REASON_MAX_LENGTH = 500;

// super_admin is deliberately excluded: it can never be created, filtered
// for, or set via this module — there is exactly one, seeded separately.
export const STAFF_ASSIGNABLE_ROLES = [
  EMPLOYEE_ROLE.EMPLOYEE,
  EMPLOYEE_ROLE.ADMIN,
] as const;
