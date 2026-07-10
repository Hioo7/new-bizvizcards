import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { EmployeeCustomersController } from './employee-customers.controller';
import { CustomersService } from './services/customers.service';

@Module({
  controllers: [CustomersController, EmployeeCustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
