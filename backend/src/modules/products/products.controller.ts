import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { addProductMediaSchema } from './dto/add-product-media.dto';
import type { AddProductMediaDto } from './dto/add-product-media.dto';
import { createProductSchema } from './dto/create-product.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import { createProductVariantSchema } from './dto/create-product-variant.dto';
import type { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { listProductsQuerySchema } from './dto/list-products-query.dto';
import type { ListProductsQueryDto } from './dto/list-products-query.dto';
import { updateProductSchema } from './dto/update-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { updateProductVariantSchema } from './dto/update-product-variant.dto';
import type { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { PRODUCT_MEDIA_MULTIPART_FILE_FIELD } from './products.constants';
import { ProductsService } from './services/products.service';

const FILE_VALIDATION_PIPE = new ParseFilePipe({ fileIsRequired: true });

@Controller('api/admin/products')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions({ product: ['list'] })
  list(
    @Query(new ZodValidationPipe(listProductsQuerySchema))
    query: ListProductsQueryDto,
  ) {
    return this.productsService.list(query);
  }

  @Get(':id')
  @RequirePermissions({ product: ['get'] })
  get(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Post()
  @RequirePermissions({ product: ['create'] })
  create(
    @Req() request: EmployeeAuthenticatedRequest,
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
  ) {
    return this.productsService.create(dto, request.employeeSession.user.id);
  }

  @Patch(':id')
  @RequirePermissions({ product: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ product: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.productsService.remove(id);
  }

  @Post(':id/variants')
  @RequirePermissions({ product: ['update'] })
  createVariant(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductVariantSchema))
    dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(id, dto);
  }

  @Patch('variants/:variantId')
  @RequirePermissions({ product: ['update'] })
  updateVariant(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(updateProductVariantSchema))
    dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @RequirePermissions({ product: ['update'] })
  removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  @Post(':id/media')
  @RequirePermissions({ product: ['update'] })
  @UseInterceptors(FileInterceptor(PRODUCT_MEDIA_MULTIPART_FILE_FIELD))
  addProductMedia(
    @Param('id') id: string,
    @UploadedFile(FILE_VALIDATION_PIPE) file: Express.Multer.File,
    @Body(new ZodValidationPipe(addProductMediaSchema))
    dto: AddProductMediaDto,
  ) {
    return this.productsService.addProductMedia(id, dto, file);
  }

  @Post('variants/:variantId/media')
  @RequirePermissions({ product: ['update'] })
  @UseInterceptors(FileInterceptor(PRODUCT_MEDIA_MULTIPART_FILE_FIELD))
  addVariantMedia(
    @Param('variantId') variantId: string,
    @UploadedFile(FILE_VALIDATION_PIPE) file: Express.Multer.File,
    @Body(new ZodValidationPipe(addProductMediaSchema))
    dto: AddProductMediaDto,
  ) {
    return this.productsService.addVariantMedia(variantId, dto, file);
  }

  @Delete('media/:productMediaId')
  @RequirePermissions({ product: ['update'] })
  removeMedia(@Param('productMediaId') productMediaId: string) {
    return this.productsService.removeMedia(productMediaId);
  }
}
