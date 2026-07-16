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
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  addEventGuestSchema,
  bulkAddEventGuestsSchema,
} from './dto/add-event-guest.dto';
import type {
  AddEventGuestDto,
  BulkAddEventGuestsDto,
} from './dto/add-event-guest.dto';
import { addEventMemberSchema } from './dto/add-event-member.dto';
import type { AddEventMemberDto } from './dto/add-event-member.dto';
import { createEventAsEmployeeSchema } from './dto/create-event-as-employee.dto';
import type { CreateEventAsEmployeeDto } from './dto/create-event-as-employee.dto';
import { createEventTrackableSchema } from './dto/create-event-trackable.dto';
import type { CreateEventTrackableDto } from './dto/create-event-trackable.dto';
import { listEventsQuerySchema } from './dto/list-events-query.dto';
import type { ListEventsQueryDto } from './dto/list-events-query.dto';
import { updateEventTrackableSchema } from './dto/update-event-trackable.dto';
import type { UpdateEventTrackableDto } from './dto/update-event-trackable.dto';
import { updateEventSchema } from './dto/update-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import { EventGuestsService } from './services/event-guests.service';
import { EventMembersService } from './services/event-members.service';
import { EventTrackablesService } from './services/event-trackables.service';
import { EventsService } from './services/events.service';

// Employee-facing: every action available to a host (event CRUD, members,
// guests, trackables) is available here too, at full parity across every
// employee tier — mirrors EmployeeOrganisationsController's all-in-one
// style. Employees never scan (see event-scan.controller.ts, customer-only).
@Controller('api/employee/business-events')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventMembersService: EventMembersService,
    private readonly eventGuestsService: EventGuestsService,
    private readonly eventTrackablesService: EventTrackablesService,
  ) {}

  @Get()
  @RequirePermissions({ event: ['list'] })
  list(
    @Query(new ZodValidationPipe(listEventsQuerySchema))
    query: ListEventsQueryDto,
  ) {
    return this.eventsService.listAllForEmployee(query);
  }

  @Post()
  @RequirePermissions({ event: ['create'] })
  create(
    @Req() request: EmployeeAuthenticatedRequest,
    @Body(new ZodValidationPipe(createEventAsEmployeeSchema))
    dto: CreateEventAsEmployeeDto,
  ) {
    return this.eventsService.createAsEmployee(
      dto,
      request.employeeSession.user.id,
    );
  }

  @Get(':id')
  @RequirePermissions({ event: ['get'] })
  get(@Param('id') id: string) {
    return this.eventsService.getByIdOrThrow(id);
  }

  @Patch(':id')
  @RequirePermissions({ event: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ event: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.eventsService.remove(id);
  }

  @Get(':id/members')
  @RequirePermissions({ event: ['get'] })
  listMembers(@Param('id') eventId: string) {
    return this.eventMembersService.listByEventId(eventId);
  }

  @Post(':id/members')
  @RequirePermissions({ event: ['update'] })
  addMember(
    @Param('id') eventId: string,
    @Body(new ZodValidationPipe(addEventMemberSchema)) dto: AddEventMemberDto,
  ) {
    return this.eventMembersService.addAsEmployee(eventId, dto);
  }

  @Delete(':id/members/:memberId')
  @RequirePermissions({ event: ['update'] })
  async removeMember(
    @Param('id') eventId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    await this.eventMembersService.removeAsEmployee(eventId, memberId);
  }

  @Get(':id/guests')
  @RequirePermissions({ event: ['get'] })
  listGuests(@Param('id') eventId: string) {
    return this.eventGuestsService.listByEventId(eventId);
  }

  @Post(':id/guests')
  @RequirePermissions({ event: ['update'] })
  addGuest(
    @Param('id') eventId: string,
    @Body(new ZodValidationPipe(addEventGuestSchema)) dto: AddEventGuestDto,
  ) {
    return this.eventGuestsService.addAsEmployee(eventId, dto);
  }

  @Post(':id/guests/bulk')
  @RequirePermissions({ event: ['update'] })
  bulkAddGuests(
    @Param('id') eventId: string,
    @Body(new ZodValidationPipe(bulkAddEventGuestsSchema))
    dto: BulkAddEventGuestsDto,
  ) {
    return this.eventGuestsService.bulkAddAsEmployee(eventId, dto);
  }

  @Delete(':id/guests/:guestId')
  @RequirePermissions({ event: ['update'] })
  async removeGuest(
    @Param('id') eventId: string,
    @Param('guestId') guestId: string,
  ): Promise<void> {
    await this.eventGuestsService.removeAsEmployee(eventId, guestId);
  }

  @Get(':id/trackables')
  @RequirePermissions({ event: ['get'] })
  listTrackables(@Param('id') eventId: string) {
    return this.eventTrackablesService.listByEventId(eventId);
  }

  @Post(':id/trackables')
  @RequirePermissions({ event: ['update'] })
  createTrackable(
    @Param('id') eventId: string,
    @Body(new ZodValidationPipe(createEventTrackableSchema))
    dto: CreateEventTrackableDto,
  ) {
    return this.eventTrackablesService.createAsEmployee(eventId, dto);
  }

  @Patch(':id/trackables/:trackableId')
  @RequirePermissions({ event: ['update'] })
  updateTrackable(
    @Param('id') eventId: string,
    @Param('trackableId') trackableId: string,
    @Body(new ZodValidationPipe(updateEventTrackableSchema))
    dto: UpdateEventTrackableDto,
  ) {
    return this.eventTrackablesService.updateAsEmployee(
      eventId,
      trackableId,
      dto,
    );
  }

  @Delete(':id/trackables/:trackableId')
  @RequirePermissions({ event: ['update'] })
  async removeTrackable(
    @Param('id') eventId: string,
    @Param('trackableId') trackableId: string,
  ): Promise<void> {
    await this.eventTrackablesService.removeAsEmployee(eventId, trackableId);
  }
}
