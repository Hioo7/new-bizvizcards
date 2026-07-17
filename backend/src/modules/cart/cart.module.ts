import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { CartController } from './cart.controller';
import { CartService } from './services/cart.service';

@Module({
  imports: [CustomersModule, ProductsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
