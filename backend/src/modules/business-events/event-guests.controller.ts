import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import {
  addEventGuestSchema,
  bulkAddEventGuestsSchema,
} from './dto/add-event-guest.dto';
import type {
  AddEventGuestDto,
  BulkAddEventGuestsDto,
} from './dto/add-event-guest.dto';
import { EventGuestsService } from './services/event-guests.service';

@Controller('api/customer/business-events/:eventId/guests')
@UseGuards(CustomerAuthGuard)
export class EventGuestsController {
  constructor(
    private readonly eventGuestsService: EventGuestsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  listGuests(@Param('eventId') eventId: string) {
    return this.eventGuestsService.listByEventId(eventId);
  }

  @Post()
  async addGuest(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(addEventGuestSchema)) dto: AddEventGuestDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventGuestsService.addAsHostOrCoHost(customer.id, eventId, dto);
  }

  @Post('bulk')
  async bulkAddGuests(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(bulkAddEventGuestsSchema))
    dto: BulkAddEventGuestsDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventGuestsService.bulkAddAsHostOrCoHost(
      customer.id,
      eventId,
      dto,
    );
  }

  @Delete(':guestId')
  async removeGuest(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.eventGuestsService.removeAsHostOrCoHost(
      customer.id,
      eventId,
      guestId,
    );
  }
}
