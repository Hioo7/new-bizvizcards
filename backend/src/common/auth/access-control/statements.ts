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
} as const;

export const employeeAccessControl = createAccessControl(employeeStatements);
