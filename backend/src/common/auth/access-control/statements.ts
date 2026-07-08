import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/admin/access';

// Base statements come from better-auth's admin plugin (user/session
// management). Custom app-domain resources get appended here later, e.g.:
//   billing: ['view', 'edit'],
export const employeeStatements = {
  ...defaultStatements,
} as const;

export const employeeAccessControl = createAccessControl(employeeStatements);
