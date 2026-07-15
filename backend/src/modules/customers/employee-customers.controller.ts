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
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { banCustomerSchema } from './dto/ban-customer.dto';
import type { BanCustomerDto } from './dto/ban-customer.dto';
import { createCustomerSchema } from './dto/create-customer.dto';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import { listCustomersQuerySchema } from './dto/list-customers-query.dto';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { setCustomerPasswordSchema } from './dto/set-customer-password.dto';
import type { SetCustomerPasswordDto } from './dto/set-customer-password.dto';
import { updateCustomerSchema } from './dto/update-customer.dto';
import type { UpdateCustomerDto } from './dto/update-customer.dto';
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

  @Post()
  @RequirePermissions({ customer: ['create'] })
  create(
    @Body(new ZodValidationPipe(createCustomerSchema)) dto: CreateCustomerDto,
  ) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions({ customer: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateForEmployee(id, dto);
  }

  @Post(':id/set-password')
  @RequirePermissions({ customer: ['set-password'] })
  setPassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setCustomerPasswordSchema))
    dto: SetCustomerPasswordDto,
  ) {
    return this.customersService.setPasswordForEmployee(id, dto);
  }

  @Post(':id/ban')
  @RequirePermissions({ customer: ['ban'] })
  ban(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(banCustomerSchema)) dto: BanCustomerDto,
  ) {
    return this.customersService.ban(id, dto);
  }

  @Post(':id/unban')
  @RequirePermissions({ customer: ['ban'] })
  unban(@Param('id') id: string) {
    return this.customersService.unban(id);
  }
}
