import { employeeAccessControl } from './statements';

// Each tier's array of extra actions is defined once and spread into every
// higher tier, so super_admin ⊇ admin ⊇ employee holds by construction — add
// a new admin capability to ADMIN_EXTRA_* and super_admin picks it up too.
const EMPLOYEE_USER_ACTIONS = ['get'] as const;
const EMPLOYEE_SESSION_ACTIONS = [] as const;

const ADMIN_EXTRA_USER_ACTIONS = [
  'create',
  'list',
  'set-role',
  'ban',
  'set-password',
  'set-email',
  'update',
] as const;
const ADMIN_EXTRA_SESSION_ACTIONS = ['list', 'revoke'] as const;

const SUPER_ADMIN_EXTRA_USER_ACTIONS = [
  'delete',
  'impersonate',
  'impersonate-admins',
] as const;
const SUPER_ADMIN_EXTRA_SESSION_ACTIONS = ['delete'] as const;

export const employeeRole = employeeAccessControl.newRole({
  user: [...EMPLOYEE_USER_ACTIONS],
  session: [...EMPLOYEE_SESSION_ACTIONS],
});

export const adminRole = employeeAccessControl.newRole({
  user: [...EMPLOYEE_USER_ACTIONS, ...ADMIN_EXTRA_USER_ACTIONS],
  session: [...EMPLOYEE_SESSION_ACTIONS, ...ADMIN_EXTRA_SESSION_ACTIONS],
});

export const superAdminRole = employeeAccessControl.newRole({
  user: [
    ...EMPLOYEE_USER_ACTIONS,
    ...ADMIN_EXTRA_USER_ACTIONS,
    ...SUPER_ADMIN_EXTRA_USER_ACTIONS,
  ],
  session: [
    ...EMPLOYEE_SESSION_ACTIONS,
    ...ADMIN_EXTRA_SESSION_ACTIONS,
    ...SUPER_ADMIN_EXTRA_SESSION_ACTIONS,
  ],
});
