import { Controller, Get, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listProductsQuerySchema } from './dto/list-products-query.dto';
import type { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductsService } from './services/products.service';

@Controller('api/products')
export class CustomerProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listProductsQuerySchema))
    query: ListProductsQueryDto,
  ) {
    // Always filter to active-only for the public-facing catalog
    return this.productsService.list({ ...query, isActive: true });
  }
}
