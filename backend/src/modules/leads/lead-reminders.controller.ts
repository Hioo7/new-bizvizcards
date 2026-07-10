import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createLeadReminderSchema } from './dto/create-lead-reminder.dto';
import type { CreateLeadReminderDto } from './dto/create-lead-reminder.dto';
import { updateLeadReminderSchema } from './dto/update-lead-reminder.dto';
import type { UpdateLeadReminderDto } from './dto/update-lead-reminder.dto';
import { RemindersService } from './services/reminders.service';

@Controller('api/leads/:leadId/reminders')
@UseGuards(CustomerAuthGuard)
export class LeadRemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async list(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.remindersService.list(customer.id, leadId);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Body(new ZodValidationPipe(createLeadReminderSchema))
    dto: CreateLeadReminderDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.remindersService.create(customer.id, leadId, dto);
  }

  @Patch(':id')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadReminderSchema))
    dto: UpdateLeadReminderDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.remindersService.update(customer.id, leadId, id, dto);
  }

  @Delete(':id')
  async delete(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.remindersService.delete(customer.id, leadId, id);
  }
}
