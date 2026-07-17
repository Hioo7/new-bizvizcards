import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createPrintBatchSchema } from './dto/create-print-batch.dto';
import type { CreatePrintBatchDto } from './dto/create-print-batch.dto';
import { generateProductUnitsSchema } from './dto/generate-product-units.dto';
import type { GenerateProductUnitsDto } from './dto/generate-product-units.dto';
import { listProductUnitsQuerySchema } from './dto/list-product-units-query.dto';
import type { ListProductUnitsQueryDto } from './dto/list-product-units-query.dto';
import { updatePrintStatusSchema } from './dto/update-print-status.dto';
import type { UpdatePrintStatusDto } from './dto/update-print-status.dto';
import { ProductProvisioningService } from './services/product-provisioning.service';

@Controller('api/admin/product-units')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class ProductUnitsController {
  constructor(
    private readonly provisioningService: ProductProvisioningService,
  ) {}

  @Get()
  @RequirePermissions({ product: ['get'] })
  list(
    @Query(new ZodValidationPipe(listProductUnitsQuerySchema))
    query: ListProductUnitsQueryDto,
  ) {
    return this.provisioningService.list(query);
  }

  @Post('generate/product/:productId')
  @RequirePermissions({ product: ['update'] })
  generateForProduct(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(generateProductUnitsSchema))
    dto: GenerateProductUnitsDto,
  ) {
    return this.provisioningService.generateForProduct(productId, dto);
  }

  @Post('generate/variant/:variantId')
  @RequirePermissions({ product: ['update'] })
  generateForVariant(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(generateProductUnitsSchema))
    dto: GenerateProductUnitsDto,
  ) {
    return this.provisioningService.generateForVariant(variantId, dto);
  }

  @Post('print-batch')
  @RequirePermissions({ product: ['update'] })
  createPrintBatch(
    @Body(new ZodValidationPipe(createPrintBatchSchema))
    dto: CreatePrintBatchDto,
  ) {
    return this.provisioningService.createPrintBatch(dto);
  }

  @Patch(':unitId/print-status')
  @RequirePermissions({ product: ['update'] })
  updatePrintStatus(
    @Param('unitId') unitId: string,
    @Body(new ZodValidationPipe(updatePrintStatusSchema))
    dto: UpdatePrintStatusDto,
  ) {
    return this.provisioningService.updatePrintStatus(unitId, dto);
  }
}
