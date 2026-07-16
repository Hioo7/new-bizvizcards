import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createEventSchema } from './dto/create-event.dto';
import type { CreateEventDto } from './dto/create-event.dto';
import { listEventsQuerySchema } from './dto/list-events-query.dto';
import type { ListEventsQueryDto } from './dto/list-events-query.dto';
import { updateEventSchema } from './dto/update-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './services/events.service';

@Controller('api/customer/business-events')
@UseGuards(CustomerAuthGuard)
export class CustomerEventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async list(
    @Req() request: CustomerAuthenticatedRequest,
    @Query(new ZodValidationPipe(listEventsQuerySchema))
    query: ListEventsQueryDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventsService.listForCustomer(customer.id, query);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventsService.create(customer.id, dto);
  }

  @Get(':id')
  async get(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventsService.getByIdForCustomerOrThrow(customer.id, id);
  }

  @Patch(':id')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventsService.updateAsHost(customer.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.eventsService.removeAsHost(customer.id, id);
  }
}
