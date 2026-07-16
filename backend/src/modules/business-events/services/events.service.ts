import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EventMemberRole, Prisma } from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import type { CreateEventAsEmployeeDto } from '../dto/create-event-as-employee.dto';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { ListEventsQueryDto } from '../dto/list-events-query.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import {
  EVENT_LIST_DEFAULT_PAGE,
  EVENT_LIST_DEFAULT_PAGE_SIZE,
  EVENT_NOT_FOUND_MESSAGE,
} from '../business-events.constants';
import { EventAccessService } from './event-access.service';

const eventWithHostInclude = {
  members: {
    where: { role: EventMemberRole.HOST },
    include: { customer: { include: { account: true } } },
  },
} satisfies Prisma.BusinessEventInclude;

type BusinessEventWithHost = Prisma.BusinessEventGetPayload<{
  include: typeof eventWithHostInclude;
}>;

export interface EventSummary {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date | null;
  hostCustomerId: string;
  hostName: string;
  createdByEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventListResult {
  events: EventSummary[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planEnforcementService: PlanEnforcementService,
    private readonly eventAccessService: EventAccessService,
  ) {}

  /**
   * The host is auto-created as an EventMember{role: HOST} row in the same
   * transaction as the BusinessEvent — mirrors how creating an Organisation
   * auto-creates its founding SPOC membership. createdByEmployeeId is set
   * only when an employee creates the event on behalf of the host.
   */
  async create(
    hostCustomerId: string,
    dto: CreateEventDto,
    createdByEmployeeId: string | null = null,
  ): Promise<EventSummary> {
    await this.planEnforcementService.assertCanCreateEvent(hostCustomerId);

    const created = await this.prisma.$transaction(async (tx) => {
      const event = await tx.businessEvent.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          location: dto.location ?? null,
          startAt: dto.startAt,
          endAt: dto.endAt ?? null,
          createdByEmployeeId,
        },
      });
      await tx.eventMember.create({
        data: {
          eventId: event.id,
          customerId: hostCustomerId,
          role: EventMemberRole.HOST,
        },
      });
      return event;
    });

    return this.getByIdOrThrow(created.id);
  }

  // actorAccountId is the authenticated employee's account id (from
  // request.employeeSession.user.id), not the app-level Employee.id —
  // resolved here the same way PlanAssignmentsService resolves its actor,
  // since createdByEmployeeId's FK points at Employee.id.
  async createAsEmployee(
    dto: CreateEventAsEmployeeDto,
    actorAccountId: string,
  ): Promise<EventSummary> {
    const { customerId, ...rest } = dto;
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    return this.create(customerId, rest, employee.id);
  }

  private async getEmployeeByAccountIdOrThrow(
    actorAccountId: string,
  ): Promise<{ id: string }> {
    return this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
      select: { id: true },
    });
  }

  async listAllForEmployee(
    query: ListEventsQueryDto,
  ): Promise<EventListResult> {
    return this.listInternal(query);
  }

  async listForCustomer(
    customerId: string,
    query: ListEventsQueryDto,
  ): Promise<EventListResult> {
    return this.listInternal(query, customerId);
  }

  async getByIdOrThrow(id: string): Promise<EventSummary> {
    const event = await this.prisma.businessEvent.findUnique({
      where: { id },
      include: eventWithHostInclude,
    });
    if (!event) {
      throw new NotFoundException(EVENT_NOT_FOUND_MESSAGE);
    }
    return this.toSummary(event);
  }

  async getByIdForCustomerOrThrow(
    customerId: string,
    id: string,
  ): Promise<EventSummary> {
    const membership = await this.prisma.eventMember.findUnique({
      where: { customerId_eventId: { customerId, eventId: id } },
    });
    if (!membership) {
      throw new NotFoundException(EVENT_NOT_FOUND_MESSAGE);
    }
    return this.getByIdOrThrow(id);
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventSummary> {
    await this.getByIdOrThrow(id);
    await this.prisma.businessEvent.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.startAt !== undefined && { startAt: dto.startAt }),
        ...(dto.endAt !== undefined && { endAt: dto.endAt }),
      },
    });
    return this.getByIdOrThrow(id);
  }

  async updateAsHost(
    customerId: string,
    id: string,
    dto: UpdateEventDto,
  ): Promise<EventSummary> {
    await this.eventAccessService.assertCanEditEventDetails(customerId, id);
    return this.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.getByIdOrThrow(id);
    await this.prisma.businessEvent.delete({ where: { id } });
  }

  async removeAsHost(customerId: string, id: string): Promise<void> {
    await this.eventAccessService.assertCanEditEventDetails(customerId, id);
    await this.remove(id);
  }

  private async listInternal(
    query: ListEventsQueryDto,
    memberCustomerId?: string,
  ): Promise<EventListResult> {
    const page = query.page ?? EVENT_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? EVENT_LIST_DEFAULT_PAGE_SIZE;

    const where = {
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' as const },
      }),
      ...(memberCustomerId && {
        members: { some: { customerId: memberCustomerId } },
      }),
    };

    const [events, total] = await Promise.all([
      this.prisma.businessEvent.findMany({
        where,
        include: eventWithHostInclude,
        orderBy: { startAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.businessEvent.count({ where }),
    ]);

    return {
      events: events.map((event) => this.toSummary(event)),
      total,
      page,
      pageSize,
    };
  }

  private toSummary(event: BusinessEventWithHost): EventSummary {
    const host = event.members[0];
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startAt: event.startAt,
      endAt: event.endAt,
      hostCustomerId: host.customerId,
      hostName: host.customer.account.name,
      createdByEmployeeId: event.createdByEmployeeId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
