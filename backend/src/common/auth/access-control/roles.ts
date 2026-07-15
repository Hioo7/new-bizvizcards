import { employeeAccessControl } from './statements';

// Each tier's array of extra actions is defined once and spread into every
// higher tier, so super_admin ⊇ admin ⊇ employee holds by construction — add
// a new admin capability to ADMIN_EXTRA_* and super_admin picks it up too.
const EMPLOYEE_USER_ACTIONS = ['get', 'list'] as const;
const EMPLOYEE_SESSION_ACTIONS = [] as const;
const EMPLOYEE_SMART_CARD_TEMPLATE_ACTIONS = ['list', 'get'] as const;
const EMPLOYEE_SMART_CARD_ACTIONS = [
  'create',
  'list',
  'get',
  'update',
] as const;
const EMPLOYEE_ECARD_ACTIONS = ['create', 'list', 'get', 'update'] as const;
const EMPLOYEE_CUSTOMER_ACTIONS = [
  'list',
  'create',
  'update',
  'set-password',
] as const;
const EMPLOYEE_REDIRECT_ACTIONS = ['list', 'get'] as const;
const EMPLOYEE_ORGANISATION_ACTIONS = [
  'list',
  'get',
  'create',
  'update',
] as const;

const ADMIN_EXTRA_USER_ACTIONS = [
  'create',
  'ban',
  'delete',
  'set-password',
  'set-email',
  'update',
] as const;
const ADMIN_EXTRA_SESSION_ACTIONS = ['list', 'revoke'] as const;
const ADMIN_EXTRA_SMART_CARD_ACTIONS = ['delete'] as const;
const ADMIN_EXTRA_ECARD_ACTIONS = ['delete'] as const;
const ADMIN_EXTRA_CUSTOMER_ACTIONS = ['ban'] as const;
const ADMIN_EXTRA_REDIRECT_ACTIONS = ['create', 'update', 'delete'] as const;
const ADMIN_EXTRA_ORGANISATION_ACTIONS = ['delete'] as const;

const SUPER_ADMIN_EXTRA_USER_ACTIONS = [
  'set-role',
  'impersonate',
  'impersonate-admins',
] as const;
const SUPER_ADMIN_EXTRA_SESSION_ACTIONS = ['delete'] as const;

export const employeeRole = employeeAccessControl.newRole({
  user: [...EMPLOYEE_USER_ACTIONS],
  session: [...EMPLOYEE_SESSION_ACTIONS],
  smartCardTemplate: [...EMPLOYEE_SMART_CARD_TEMPLATE_ACTIONS],
  smartCard: [...EMPLOYEE_SMART_CARD_ACTIONS],
  eCard: [...EMPLOYEE_ECARD_ACTIONS],
  customer: [...EMPLOYEE_CUSTOMER_ACTIONS],
  redirect: [...EMPLOYEE_REDIRECT_ACTIONS],
  organisation: [...EMPLOYEE_ORGANISATION_ACTIONS],
});

export const adminRole = employeeAccessControl.newRole({
  user: [...EMPLOYEE_USER_ACTIONS, ...ADMIN_EXTRA_USER_ACTIONS],
  session: [...EMPLOYEE_SESSION_ACTIONS, ...ADMIN_EXTRA_SESSION_ACTIONS],
  smartCardTemplate: [...EMPLOYEE_SMART_CARD_TEMPLATE_ACTIONS],
  smartCard: [
    ...EMPLOYEE_SMART_CARD_ACTIONS,
    ...ADMIN_EXTRA_SMART_CARD_ACTIONS,
  ],
  eCard: [...EMPLOYEE_ECARD_ACTIONS, ...ADMIN_EXTRA_ECARD_ACTIONS],
  customer: [...EMPLOYEE_CUSTOMER_ACTIONS, ...ADMIN_EXTRA_CUSTOMER_ACTIONS],
  redirect: [...EMPLOYEE_REDIRECT_ACTIONS, ...ADMIN_EXTRA_REDIRECT_ACTIONS],
  organisation: [
    ...EMPLOYEE_ORGANISATION_ACTIONS,
    ...ADMIN_EXTRA_ORGANISATION_ACTIONS,
  ],
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
  smartCardTemplate: [...EMPLOYEE_SMART_CARD_TEMPLATE_ACTIONS],
  // super_admin gets the same smartCard actions as admin — no super-admin-only
  // smart-card action exists, so it's spread from the same admin-tier const
  // rather than duplicated, keeping super_admin ⊇ admin by construction.
  smartCard: [
    ...EMPLOYEE_SMART_CARD_ACTIONS,
    ...ADMIN_EXTRA_SMART_CARD_ACTIONS,
  ],
  // super_admin gets the same eCard actions as admin — no super-admin-only
  // e-card action exists, so it's spread from the same admin-tier const
  // rather than duplicated, keeping super_admin ⊇ admin by construction.
  eCard: [...EMPLOYEE_ECARD_ACTIONS, ...ADMIN_EXTRA_ECARD_ACTIONS],
  // super_admin gets the same customer actions as admin — no super-admin-only
  // customer action exists, so it's spread from the same admin-tier const
  // rather than duplicated, keeping super_admin ⊇ admin by construction.
  customer: [...EMPLOYEE_CUSTOMER_ACTIONS, ...ADMIN_EXTRA_CUSTOMER_ACTIONS],
  // super_admin gets the same redirect actions as admin — no super-admin-only
  // redirect action exists, so it's spread from the same admin-tier const
  // rather than duplicated, keeping super_admin ⊇ admin by construction.
  redirect: [...EMPLOYEE_REDIRECT_ACTIONS, ...ADMIN_EXTRA_REDIRECT_ACTIONS],
  // super_admin gets the same organisation actions as admin — no
  // super-admin-only organisation action exists, so it's spread from the
  // same admin-tier const rather than duplicated, keeping
  // super_admin ⊇ admin by construction.
  organisation: [
    ...EMPLOYEE_ORGANISATION_ACTIONS,
    ...ADMIN_EXTRA_ORGANISATION_ACTIONS,
  ],
});
