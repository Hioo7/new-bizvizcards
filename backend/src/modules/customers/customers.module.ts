import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './services/customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
