import { Module } from '@nestjs/common';
import { AddressesModule } from '../addresses/addresses.module';
import { CartModule } from '../cart/cart.module';
import { CustomersModule } from '../customers/customers.module';
import { CustomerOrdersController } from './customer-orders.controller';
import { EmployeeOrdersController } from './employee-orders.controller';
import { OrdersService } from './services/orders.service';

@Module({
  imports: [AddressesModule, CartModule, CustomersModule],
  controllers: [CustomerOrdersController, EmployeeOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
