import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './services/addresses.service';

@Module({
  imports: [CustomersModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
