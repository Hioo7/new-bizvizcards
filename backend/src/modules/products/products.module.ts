import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductUnitsController } from './product-units.controller';
import { ProductsService } from './services/products.service';
import { ProductProvisioningService } from './services/product-provisioning.service';

@Module({
  controllers: [ProductsController, ProductUnitsController],
  providers: [ProductsService, ProductProvisioningService],
  exports: [ProductsService, ProductProvisioningService],
})
export class ProductsModule {}
