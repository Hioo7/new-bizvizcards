import { Global, Module } from '@nestjs/common';
import { EmployeeAuthGuard } from './employee-auth.guard';
import { CustomerAuthGuard } from './customer-auth.guard';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  providers: [EmployeeAuthGuard, CustomerAuthGuard, PermissionsGuard],
  exports: [EmployeeAuthGuard, CustomerAuthGuard, PermissionsGuard],
})
export class GuardsModule {}
