import { employeeRole, adminRole, superAdminRole } from './roles';

function assertIsSubsetOf(
  lower: Record<string, readonly string[]>,
  higher: Record<string, readonly string[]>,
) {
  for (const [resource, actions] of Object.entries(lower)) {
    for (const action of actions) {
      expect(higher[resource]).toContain(action);
    }
  }
}

describe('employee role hierarchy', () => {
  it('every employee action is also granted to admin', () => {
    assertIsSubsetOf(employeeRole.statements, adminRole.statements);
  });

  it('every admin action is also granted to super_admin', () => {
    assertIsSubsetOf(adminRole.statements, superAdminRole.statements);
  });

  it('employee has no user/session management actions', () => {
    expect(employeeRole.statements.user).toEqual(['get']);
    expect(employeeRole.statements.session).toEqual([]);
  });
});
