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

  it('employee can only view/list, with no user/session management actions', () => {
    expect(employeeRole.statements.user).toEqual(['get', 'list']);
    expect(employeeRole.statements.session).toEqual([]);
  });

  it('only super_admin can change a user role', () => {
    expect(employeeRole.statements.user).not.toContain('set-role');
    expect(adminRole.statements.user).not.toContain('set-role');
    expect(superAdminRole.statements.user).toContain('set-role');
  });

  it('employee can create/list/get/update smart cards but not delete', () => {
    expect(employeeRole.statements.smartCard).toEqual([
      'create',
      'list',
      'get',
      'update',
    ]);
  });

  it('admin and super_admin can both delete smart cards', () => {
    expect(adminRole.statements.smartCard).toContain('delete');
    expect(superAdminRole.statements.smartCard).toContain('delete');
  });

  it('all three roles share identical smart card template read access', () => {
    expect(employeeRole.statements.smartCardTemplate).toEqual(['list', 'get']);
    expect(adminRole.statements.smartCardTemplate).toEqual(['list', 'get']);
    expect(superAdminRole.statements.smartCardTemplate).toEqual([
      'list',
      'get',
    ]);
  });

  it('all three roles can list customers, with no tier restriction', () => {
    expect(employeeRole.statements.customer).toEqual(['list']);
    expect(adminRole.statements.customer).toEqual(['list']);
    expect(superAdminRole.statements.customer).toEqual(['list']);
  });
});
