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
import { createEventTrackableSchema } from './dto/create-event-trackable.dto';
import type { CreateEventTrackableDto } from './dto/create-event-trackable.dto';
import { updateEventTrackableSchema } from './dto/update-event-trackable.dto';
import type { UpdateEventTrackableDto } from './dto/update-event-trackable.dto';
import { EventTrackablesService } from './services/event-trackables.service';

@Controller('api/customer/business-events/:eventId/trackables')
@UseGuards(CustomerAuthGuard)
export class EventTrackablesController {
  constructor(
    private readonly eventTrackablesService: EventTrackablesService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  listTrackables(@Param('eventId') eventId: string) {
    return this.eventTrackablesService.listByEventId(eventId);
  }

  @Post()
  async createTrackable(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(createEventTrackableSchema))
    dto: CreateEventTrackableDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventTrackablesService.createAsHostOrCoHost(
      customer.id,
      eventId,
      dto,
    );
  }

  @Patch(':trackableId')
  async updateTrackable(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Param('trackableId') trackableId: string,
    @Body(new ZodValidationPipe(updateEventTrackableSchema))
    dto: UpdateEventTrackableDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventTrackablesService.updateAsHostOrCoHost(
      customer.id,
      eventId,
      trackableId,
      dto,
    );
  }

  @Delete(':trackableId')
  async removeTrackable(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Param('trackableId') trackableId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.eventTrackablesService.removeAsHostOrCoHost(
      customer.id,
      eventId,
      trackableId,
    );
  }
}
