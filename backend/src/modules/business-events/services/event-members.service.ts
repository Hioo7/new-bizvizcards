import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EventMemberRole } from '../../../generated/prisma/client';
import type { AddEventMemberDto } from '../dto/add-event-member.dto';
import {
  EVENT_ALREADY_MEMBER_MESSAGE,
  EVENT_CO_HOST_LIMIT_REACHED_MESSAGE,
  EVENT_HOST_ROLE_IMMUTABLE_MESSAGE,
  EVENT_MAX_CO_HOSTS,
  EVENT_MAX_VOLUNTEERS,
  EVENT_MEMBER_NOT_FOUND_MESSAGE,
  EVENT_VOLUNTEER_LIMIT_REACHED_MESSAGE,
} from '../business-events.constants';
import { EventAccessService } from './event-access.service';
import { EventsService } from './events.service';

export interface EventMemberListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: EventMemberRole;
  joinedAt: Date;
}

@Injectable()
export class EventMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly eventAccessService: EventAccessService,
  ) {}

  async listByEventId(eventId: string): Promise<EventMemberListItem[]> {
    const members = await this.prisma.eventMember.findMany({
      where: { eventId },
      include: { customer: { include: { account: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((member) => this.toListItem(member));
  }

  async addAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    dto: AddEventMemberDto,
  ): Promise<EventMemberListItem> {
    await this.assertCanManage(actingCustomerId, eventId, dto.role);
    return this.addMember(eventId, dto.customerId, dto.role);
  }

  async addAsEmployee(
    eventId: string,
    dto: AddEventMemberDto,
  ): Promise<EventMemberListItem> {
    return this.addMember(eventId, dto.customerId, dto.role);
  }

  async removeAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    memberId: string,
  ): Promise<void> {
    const member = await this.getMemberInEventOrThrow(memberId, eventId);
    this.assertRemovable(member.role);
    await this.assertCanManage(actingCustomerId, eventId, member.role);
    await this.prisma.eventMember.delete({ where: { id: memberId } });
  }

  async removeAsEmployee(eventId: string, memberId: string): Promise<void> {
    const member = await this.getMemberInEventOrThrow(memberId, eventId);
    this.assertRemovable(member.role);
    await this.prisma.eventMember.delete({ where: { id: memberId } });
  }

  private async assertCanManage(
    actingCustomerId: string,
    eventId: string,
    role: EventMemberRole,
  ): Promise<void> {
    if (role === EventMemberRole.CO_HOST) {
      await this.eventAccessService.assertCanManageCoHosts(
        actingCustomerId,
        eventId,
      );
    } else {
      await this.eventAccessService.assertCanManageVolunteers(
        actingCustomerId,
        eventId,
      );
    }
  }

  private assertRemovable(role: EventMemberRole): void {
    if (role === EventMemberRole.HOST) {
      throw new ForbiddenException(EVENT_HOST_ROLE_IMMUTABLE_MESSAGE);
    }
  }

  private async addMember(
    eventId: string,
    customerId: string,
    role: EventMemberRole,
  ): Promise<EventMemberListItem> {
    await this.eventsService.getByIdOrThrow(eventId);

    const customerExists = await this.prisma.customer.count({
      where: { id: customerId },
    });
    if (customerExists === 0) {
      throw new BadRequestException(
        'customerId does not reference an existing customer',
      );
    }

    const existing = await this.prisma.eventMember.findUnique({
      where: { customerId_eventId: { customerId, eventId } },
    });
    if (existing) {
      throw new ConflictException(EVENT_ALREADY_MEMBER_MESSAGE);
    }

    const cap =
      role === EventMemberRole.CO_HOST
        ? EVENT_MAX_CO_HOSTS
        : EVENT_MAX_VOLUNTEERS;
    const currentCount = await this.prisma.eventMember.count({
      where: { eventId, role },
    });
    if (currentCount >= cap) {
      throw new ConflictException(
        role === EventMemberRole.CO_HOST
          ? EVENT_CO_HOST_LIMIT_REACHED_MESSAGE
          : EVENT_VOLUNTEER_LIMIT_REACHED_MESSAGE,
      );
    }

    const created = await this.prisma.eventMember.create({
      data: { eventId, customerId, role },
      include: { customer: { include: { account: true } } },
    });
    return this.toListItem(created);
  }

  private async getMemberInEventOrThrow(memberId: string, eventId: string) {
    const member = await this.prisma.eventMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.eventId !== eventId) {
      throw new NotFoundException(EVENT_MEMBER_NOT_FOUND_MESSAGE);
    }
    return member;
  }

  private toListItem(member: {
    id: string;
    customerId: string;
    role: EventMemberRole;
    joinedAt: Date;
    customer: { account: { name: string; email: string } };
  }): EventMemberListItem {
    return {
      id: member.id,
      customerId: member.customerId,
      name: member.customer.account.name,
      email: member.customer.account.email,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
