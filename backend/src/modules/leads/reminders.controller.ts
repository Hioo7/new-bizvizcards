import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { dueRemindersQuerySchema } from './dto/due-reminders-query.dto';
import type { DueRemindersQueryDto } from './dto/due-reminders-query.dto';
import { RemindersService } from './services/reminders.service';

@Controller('api/reminders')
@UseGuards(CustomerAuthGuard)
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('due')
  async due(
    @Req() request: CustomerAuthenticatedRequest,
    @Query(new ZodValidationPipe(dueRemindersQuerySchema))
    query: DueRemindersQueryDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.remindersService.getDue(customer.id, query.withinMinutes);
  }
}
