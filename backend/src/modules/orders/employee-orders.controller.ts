import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listOrdersQuerySchema } from './dto/list-orders-query.dto';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { updateOrderStatusSchema } from './dto/update-order-status.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './services/orders.service';

@Controller('api/employee/orders')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions({ order: ['list'] })
  list(
    @Query(new ZodValidationPipe(listOrdersQuerySchema))
    query: ListOrdersQueryDto,
  ) {
    return this.ordersService.listForEmployee(query);
  }

  @Get(':id')
  @RequirePermissions({ order: ['get'] })
  get(@Param('id') id: string) {
    return this.ordersService.getForEmployee(id);
  }

  @Patch(':id/status')
  @RequirePermissions({ order: ['update'] })
  updateStatus(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema))
    dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      id,
      dto,
      request.employeeSession.user.id,
    );
  }
}
