import { SetMetadata } from '@nestjs/common';
import { employeeStatements } from '../auth/access-control';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';

type EmployeeStatements = typeof employeeStatements;

export type PermissionRequirement = {
  [Resource in keyof EmployeeStatements]?: Array<
    EmployeeStatements[Resource][number]
  >;
};

export const RequirePermissions = (permissions: PermissionRequirement) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
