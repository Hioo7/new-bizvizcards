import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/admin/access';

// Base statements come from better-auth's admin plugin (user/session
// management). Custom app-domain resources get appended here.
export const employeeStatements = {
  ...defaultStatements,
  smartCardTemplate: ['list', 'get'],
  smartCard: ['create', 'list', 'get', 'update', 'delete'],
  eCard: ['create', 'list', 'get', 'update', 'delete'],
  customer: ['list', 'create', 'update', 'set-password', 'ban'],
  redirect: ['list', 'get', 'create', 'update', 'delete'],
  organisation: ['list', 'get', 'create', 'update', 'delete'],
  plan: ['list', 'get', 'create', 'update', 'delete'],
  event: ['list', 'get', 'create', 'update', 'delete'],
  product: ['list', 'get', 'create', 'update', 'delete'],
  order: ['list', 'get', 'update'],
  // Legacy-data migration tool — super_admin only, see roles.ts. Not spread
  // into employeeRole/adminRole at all (empty array), unlike every other
  // resource here which every tier gets at least partial access to.
  migration: ['run', 'list', 'get'],
} as const;

export const employeeAccessControl = createAccessControl(employeeStatements);
