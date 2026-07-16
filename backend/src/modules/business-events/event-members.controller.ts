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
import { addEventMemberSchema } from './dto/add-event-member.dto';
import type { AddEventMemberDto } from './dto/add-event-member.dto';
import { EventMembersService } from './services/event-members.service';

@Controller('api/customer/business-events/:eventId/members')
@UseGuards(CustomerAuthGuard)
export class EventMembersController {
  constructor(
    private readonly eventMembersService: EventMembersService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  listMembers(@Param('eventId') eventId: string) {
    return this.eventMembersService.listByEventId(eventId);
  }

  @Post()
  async addMember(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(addEventMemberSchema)) dto: AddEventMemberDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventMembersService.addAsHostOrCoHost(
      customer.id,
      eventId,
      dto,
    );
  }

  @Delete(':memberId')
  async removeMember(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.eventMembersService.removeAsHostOrCoHost(
      customer.id,
      eventId,
      memberId,
    );
  }
}
