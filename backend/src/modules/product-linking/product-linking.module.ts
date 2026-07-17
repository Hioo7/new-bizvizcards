import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PublicProductLinkController } from './public-product-link.controller';
import { CustomerProductLinkController } from './customer-product-link.controller';
import { ProductLinkResolverService } from './services/product-link-resolver.service';
import { ProductLinkService } from './services/product-link.service';

@Module({
  imports: [CustomersModule],
  controllers: [PublicProductLinkController, CustomerProductLinkController],
  providers: [ProductLinkResolverService, ProductLinkService],
})
export class ProductLinkingModule {}
