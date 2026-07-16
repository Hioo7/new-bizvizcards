import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import type { BulkAddEventGuestsDto } from '../dto/add-event-guest.dto';
import type { AddEventGuestDto } from '../dto/add-event-guest.dto';
import {
  EVENT_ALREADY_GUEST_MESSAGE,
  EVENT_GUEST_NOT_FOUND_MESSAGE,
} from '../business-events.constants';
import { EventAccessService } from './event-access.service';
import { EventsService } from './events.service';

export interface EventGuestListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  checkedInAt: Date | null;
}

@Injectable()
export class EventGuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly eventAccessService: EventAccessService,
    private readonly planEnforcementService: PlanEnforcementService,
  ) {}

  async listByEventId(eventId: string): Promise<EventGuestListItem[]> {
    const guests = await this.prisma.eventGuest.findMany({
      where: { eventId },
      include: { customer: { include: { account: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return guests.map((guest) => this.toListItem(guest));
  }

  async addAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    dto: AddEventGuestDto,
  ): Promise<EventGuestListItem> {
    await this.eventAccessService.assertCanManageGuests(
      actingCustomerId,
      eventId,
    );
    return this.addSingleGuest(eventId, dto.customerId);
  }

  async addAsEmployee(
    eventId: string,
    dto: AddEventGuestDto,
  ): Promise<EventGuestListItem> {
    return this.addSingleGuest(eventId, dto.customerId);
  }

  async bulkAddAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    dto: BulkAddEventGuestsDto,
  ): Promise<EventGuestListItem[]> {
    await this.eventAccessService.assertCanManageGuests(
      actingCustomerId,
      eventId,
    );
    return this.bulkAddGuests(eventId, dto.customerIds);
  }

  async bulkAddAsEmployee(
    eventId: string,
    dto: BulkAddEventGuestsDto,
  ): Promise<EventGuestListItem[]> {
    return this.bulkAddGuests(eventId, dto.customerIds);
  }

  async removeAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    guestId: string,
  ): Promise<void> {
    await this.eventAccessService.assertCanManageGuests(
      actingCustomerId,
      eventId,
    );
    await this.getGuestInEventOrThrow(guestId, eventId);
    await this.prisma.eventGuest.delete({ where: { id: guestId } });
  }

  async removeAsEmployee(eventId: string, guestId: string): Promise<void> {
    await this.getGuestInEventOrThrow(guestId, eventId);
    await this.prisma.eventGuest.delete({ where: { id: guestId } });
  }

  // Sequential, not atomic across the whole batch — each guest is checked
  // and added one at a time so the shared per-event guest cap
  // (maxGuestsPerEvent) is enforced incrementally and correctly, rather than
  // all being validated against the same pre-batch count.
  private async bulkAddGuests(
    eventId: string,
    customerIds: string[],
  ): Promise<EventGuestListItem[]> {
    const uniqueCustomerIds = [...new Set(customerIds)];
    const results: EventGuestListItem[] = [];
    for (const customerId of uniqueCustomerIds) {
      results.push(await this.addSingleGuest(eventId, customerId));
    }
    return results;
  }

  private async addSingleGuest(
    eventId: string,
    customerId: string,
  ): Promise<EventGuestListItem> {
    await this.eventsService.getByIdOrThrow(eventId);

    const customerExists = await this.prisma.customer.count({
      where: { id: customerId },
    });
    if (customerExists === 0) {
      throw new BadRequestException(
        'customerId does not reference an existing customer',
      );
    }

    const existing = await this.prisma.eventGuest.findUnique({
      where: { customerId_eventId: { customerId, eventId } },
    });
    if (existing) {
      throw new ConflictException(EVENT_ALREADY_GUEST_MESSAGE);
    }

    await this.planEnforcementService.assertCanAddEventGuest(eventId);

    const created = await this.prisma.eventGuest.create({
      data: { eventId, customerId },
      include: { customer: { include: { account: true } } },
    });
    return this.toListItem(created);
  }

  private async getGuestInEventOrThrow(guestId: string, eventId: string) {
    const guest = await this.prisma.eventGuest.findUnique({
      where: { id: guestId },
    });
    if (!guest || guest.eventId !== eventId) {
      throw new NotFoundException(EVENT_GUEST_NOT_FOUND_MESSAGE);
    }
    return guest;
  }

  private toListItem(guest: {
    id: string;
    customerId: string;
    checkedInAt: Date | null;
    customer: { account: { name: string; email: string } };
  }): EventGuestListItem {
    return {
      id: guest.id,
      customerId: guest.customerId,
      name: guest.customer.account.name,
      email: guest.customer.account.email,
      checkedInAt: guest.checkedInAt,
    };
  }
}
