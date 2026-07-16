import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { CustomerEventsController } from './customer-events.controller';
import { EventGuestsController } from './event-guests.controller';
import { EventMembersController } from './event-members.controller';
import { EventScanController } from './event-scan.controller';
import { EventTrackablesController } from './event-trackables.controller';
import { EventsController } from './events.controller';
import { EventAccessService } from './services/event-access.service';
import { EventGuestsService } from './services/event-guests.service';
import { EventMembersService } from './services/event-members.service';
import { EventScanningService } from './services/event-scanning.service';
import { EventTrackablesService } from './services/event-trackables.service';
import { EventsService } from './services/events.service';

@Module({
  imports: [CustomersModule, PlansModule],
  controllers: [
    EventsController,
    CustomerEventsController,
    EventMembersController,
    EventGuestsController,
    EventTrackablesController,
    EventScanController,
  ],
  providers: [
    EventAccessService,
    EventsService,
    EventMembersService,
    EventGuestsService,
    EventTrackablesService,
    EventScanningService,
  ],
  exports: [EventsService, EventAccessService],
})
export class BusinessEventsModule {}
