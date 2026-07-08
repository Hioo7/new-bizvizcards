import { Global, Module } from '@nestjs/common';
import { EmployeeAuthGuard } from './employee-auth.guard';
import { CustomerAuthGuard } from './customer-auth.guard';

@Global()
@Module({
  providers: [EmployeeAuthGuard, CustomerAuthGuard],
  exports: [EmployeeAuthGuard, CustomerAuthGuard],
})
export class GuardsModule {}
