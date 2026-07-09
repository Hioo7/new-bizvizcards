import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listCustomersQuerySchema } from './dto/list-customers-query.dto';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { CustomersService } from './services/customers.service';

@Controller('api/customers')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeCustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions({ customer: ['list'] })
  list(
    @Query(new ZodValidationPipe(listCustomersQuerySchema))
    query: ListCustomersQueryDto,
  ) {
    return this.customersService.list(query);
  }
}
