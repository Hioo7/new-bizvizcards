import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ScanGuestDto } from '../dto/scan-guest.dto';
import {
  EVENT_CARD_NOT_FOUND_MESSAGE,
  EVENT_CARD_UNCLAIMED_MESSAGE,
  EVENT_GUEST_ALREADY_CHECKED_IN_MESSAGE,
  EVENT_GUEST_NOT_WHITELISTED_MESSAGE,
  EVENT_TRACKABLE_ALREADY_REDEEMED_MESSAGE,
  EVENT_TRACKABLE_DEPENDENCY_NOT_MET_MESSAGE,
  EVENT_TRACKABLE_NOT_FOUND_MESSAGE,
} from '../business-events.constants';
import { EventAccessService } from './event-access.service';

export interface EventScanResult {
  eventGuestId: string;
  customerId: string;
  customerName: string;
  checkedInAt: Date;
}

export interface EventTrackableScanResult {
  redemptionId: string;
  eventGuestId: string;
  customerId: string;
  customerName: string;
  redeemedAt: Date;
}

/**
 * QR payload = the existing public card URL (/ecard/:endpoint or
 * /smartcard/:endpoint) — no new "ticket" identifier on ECard/SmartCard.
 * Scanning resolves {cardType, endpoint} -> customerId via the existing
 * tables, then checks that customerId against the event's guest whitelist.
 */
@Injectable()
export class EventScanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventAccessService: EventAccessService,
  ) {}

  async resolveCardOwner(dto: ScanGuestDto): Promise<string> {
    if (dto.cardType === 'ECARD') {
      const card = await this.prisma.eCard.findUnique({
        where: { endpoint: dto.endpoint },
        select: { customerId: true },
      });
      if (!card) {
        throw new NotFoundException(EVENT_CARD_NOT_FOUND_MESSAGE);
      }
      return card.customerId;
    }

    const card = await this.prisma.smartCard.findUnique({
      where: { endpoint: dto.endpoint },
      select: { customerId: true },
    });
    if (!card) {
      throw new NotFoundException(EVENT_CARD_NOT_FOUND_MESSAGE);
    }
    if (!card.customerId) {
      throw new ConflictException(EVENT_CARD_UNCLAIMED_MESSAGE);
    }
    return card.customerId;
  }

  async scanGate(
    eventId: string,
    actingCustomerId: string,
    dto: ScanGuestDto,
  ): Promise<EventScanResult> {
    await this.eventAccessService.assertCanScan(actingCustomerId, eventId);
    const customerId = await this.resolveCardOwner(dto);

    const guest = await this.prisma.eventGuest.findUnique({
      where: { customerId_eventId: { customerId, eventId } },
      include: { customer: { include: { account: true } } },
    });
    if (!guest) {
      throw new ForbiddenException(EVENT_GUEST_NOT_WHITELISTED_MESSAGE);
    }
    if (guest.checkedInAt) {
      throw new ConflictException(EVENT_GUEST_ALREADY_CHECKED_IN_MESSAGE);
    }

    const updated = await this.prisma.eventGuest.update({
      where: { id: guest.id },
      data: {
        checkedInAt: new Date(),
        checkedInByCustomerId: actingCustomerId,
      },
    });

    return {
      eventGuestId: updated.id,
      customerId,
      customerName: guest.customer.account.name,
      checkedInAt: updated.checkedInAt!,
    };
  }

  // Independent of gate check-in by design: only checks that the customer is
  // whitelisted for this event and hasn't already redeemed this trackable.
  async scanTrackable(
    eventId: string,
    trackableId: string,
    actingCustomerId: string,
    dto: ScanGuestDto,
  ): Promise<EventTrackableScanResult> {
    await this.eventAccessService.assertCanScan(actingCustomerId, eventId);

    const trackable = await this.prisma.eventTrackable.findUnique({
      where: { id: trackableId },
      include: {
        dependencies: {
          include: { dependsOnTrackable: { select: { id: true, name: true } } },
        },
      },
    });
    if (!trackable || trackable.eventId !== eventId) {
      throw new NotFoundException(EVENT_TRACKABLE_NOT_FOUND_MESSAGE);
    }

    const customerId = await this.resolveCardOwner(dto);

    const guest = await this.prisma.eventGuest.findUnique({
      where: { customerId_eventId: { customerId, eventId } },
      include: { customer: { include: { account: true } } },
    });
    if (!guest) {
      throw new ForbiddenException(EVENT_GUEST_NOT_WHITELISTED_MESSAGE);
    }

    if (trackable.dependencies.length > 0) {
      const redemptions = await this.prisma.eventTrackableRedemption.findMany({
        where: {
          eventGuestId: guest.id,
          trackableId: {
            in: trackable.dependencies.map((d) => d.dependsOnTrackableId),
          },
        },
        select: { trackableId: true },
      });
      const redeemedTrackableIds = new Set(
        redemptions.map((r) => r.trackableId),
      );
      const unmetDependencies = trackable.dependencies
        .filter((d) => !redeemedTrackableIds.has(d.dependsOnTrackableId))
        .map((d) => d.dependsOnTrackable.name);
      if (unmetDependencies.length > 0) {
        throw new ForbiddenException(
          `${EVENT_TRACKABLE_DEPENDENCY_NOT_MET_MESSAGE}: ${unmetDependencies.join(', ')}`,
        );
      }
    }

    const existingRedemption =
      await this.prisma.eventTrackableRedemption.findUnique({
        where: {
          trackableId_eventGuestId: { trackableId, eventGuestId: guest.id },
        },
      });
    if (existingRedemption) {
      throw new ConflictException(EVENT_TRACKABLE_ALREADY_REDEEMED_MESSAGE);
    }

    const redemption = await this.prisma.eventTrackableRedemption.create({
      data: {
        trackableId,
        eventGuestId: guest.id,
        scannedByCustomerId: actingCustomerId,
      },
    });

    return {
      redemptionId: redemption.id,
      eventGuestId: guest.id,
      customerId,
      customerName: guest.customer.account.name,
      redeemedAt: redemption.redeemedAt,
    };
  }
}
