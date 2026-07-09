import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/admin/access';

// Base statements come from better-auth's admin plugin (user/session
// management). Custom app-domain resources get appended here.
export const employeeStatements = {
  ...defaultStatements,
  smartCardTemplate: ['list', 'get'],
  smartCard: ['create', 'list', 'get', 'update', 'delete'],
  customer: ['list'],
} as const;

export const employeeAccessControl = createAccessControl(employeeStatements);
