import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import type { CreateEventTrackableDto } from '../dto/create-event-trackable.dto';
import type { UpdateEventTrackableDto } from '../dto/update-event-trackable.dto';
import {
  EVENT_TRACKABLE_CIRCULAR_DEPENDENCY_MESSAGE,
  EVENT_TRACKABLE_DEPENDENCY_NOT_IN_EVENT_MESSAGE,
  EVENT_TRACKABLE_NOT_FOUND_MESSAGE,
  EVENT_TRACKABLE_SELF_DEPENDENCY_MESSAGE,
} from '../business-events.constants';
import { EventAccessService } from './event-access.service';
import { EventsService } from './events.service';

const trackableWithDependenciesInclude = {
  _count: { select: { redemptions: true } },
  dependencies: {
    include: { dependsOnTrackable: { select: { id: true, name: true } } },
  },
} satisfies Prisma.EventTrackableInclude;

type EventTrackableWithDependencies = Prisma.EventTrackableGetPayload<{
  include: typeof trackableWithDependenciesInclude;
}>;

export interface EventTrackableListItem {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  redemptionCount: number;
  dependencies: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EventTrackablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly eventAccessService: EventAccessService,
  ) {}

  async listByEventId(eventId: string): Promise<EventTrackableListItem[]> {
    const trackables = await this.prisma.eventTrackable.findMany({
      where: { eventId },
      include: trackableWithDependenciesInclude,
      orderBy: { createdAt: 'asc' },
    });
    return trackables.map((trackable) => this.toListItem(trackable));
  }

  async createAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    dto: CreateEventTrackableDto,
  ): Promise<EventTrackableListItem> {
    await this.eventAccessService.assertCanManageTrackables(
      actingCustomerId,
      eventId,
    );
    return this.create(eventId, dto);
  }

  async createAsEmployee(
    eventId: string,
    dto: CreateEventTrackableDto,
  ): Promise<EventTrackableListItem> {
    return this.create(eventId, dto);
  }

  async updateAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    trackableId: string,
    dto: UpdateEventTrackableDto,
  ): Promise<EventTrackableListItem> {
    await this.eventAccessService.assertCanManageTrackables(
      actingCustomerId,
      eventId,
    );
    return this.update(eventId, trackableId, dto);
  }

  async updateAsEmployee(
    eventId: string,
    trackableId: string,
    dto: UpdateEventTrackableDto,
  ): Promise<EventTrackableListItem> {
    return this.update(eventId, trackableId, dto);
  }

  async removeAsHostOrCoHost(
    actingCustomerId: string,
    eventId: string,
    trackableId: string,
  ): Promise<void> {
    await this.eventAccessService.assertCanManageTrackables(
      actingCustomerId,
      eventId,
    );
    await this.getTrackableInEventOrThrow(trackableId, eventId);
    await this.prisma.eventTrackable.delete({ where: { id: trackableId } });
  }

  async removeAsEmployee(eventId: string, trackableId: string): Promise<void> {
    await this.getTrackableInEventOrThrow(trackableId, eventId);
    await this.prisma.eventTrackable.delete({ where: { id: trackableId } });
  }

  private async create(
    eventId: string,
    dto: CreateEventTrackableDto,
  ): Promise<EventTrackableListItem> {
    await this.eventsService.getByIdOrThrow(eventId);
    const dependsOnTrackableIds = await this.assertValidDependencies(
      eventId,
      null,
      dto.dependsOnTrackableIds ?? [],
    );

    const created = await this.prisma.eventTrackable.create({
      data: {
        eventId,
        name: dto.name,
        description: dto.description ?? null,
        dependencies: {
          create: dependsOnTrackableIds.map((dependsOnTrackableId) => ({
            dependsOnTrackableId,
          })),
        },
      },
      include: trackableWithDependenciesInclude,
    });
    return this.toListItem(created);
  }

  private async update(
    eventId: string,
    trackableId: string,
    dto: UpdateEventTrackableDto,
  ): Promise<EventTrackableListItem> {
    await this.getTrackableInEventOrThrow(trackableId, eventId);

    const dependsOnTrackableIds =
      dto.dependsOnTrackableIds !== undefined
        ? await this.assertValidDependencies(
            eventId,
            trackableId,
            dto.dependsOnTrackableIds,
          )
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.eventTrackable.update({
        where: { id: trackableId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
        },
      });
      // Full-replace, mirroring this codebase's existing convention for
      // nested collections (e.g. PlansService's whitelisted-templates
      // replace) — the incoming list always fully describes the desired
      // dependency set, never a partial add/remove.
      if (dependsOnTrackableIds !== undefined) {
        await tx.eventTrackableDependency.deleteMany({
          where: { trackableId },
        });
        if (dependsOnTrackableIds.length > 0) {
          await tx.eventTrackableDependency.createMany({
            data: dependsOnTrackableIds.map((dependsOnTrackableId) => ({
              trackableId,
              dependsOnTrackableId,
            })),
          });
        }
      }
    });

    const updated = await this.prisma.eventTrackable.findUniqueOrThrow({
      where: { id: trackableId },
      include: trackableWithDependenciesInclude,
    });
    return this.toListItem(updated);
  }

  /**
   * Validates a proposed dependency list: dedupes it, rejects self-reference
   * (update only — a brand-new trackable's id doesn't exist yet), rejects
   * any id that isn't a trackable belonging to this same event, and — on
   * update only — rejects any addition that would close a circular chain.
   * A new trackable can never be part of an existing cycle since nothing
   * could have depended on it before it existed, so the cycle check is
   * skipped on create.
   */
  private async assertValidDependencies(
    eventId: string,
    trackableId: string | null,
    rawDependsOnTrackableIds: string[],
  ): Promise<string[]> {
    const dependsOnTrackableIds = [...new Set(rawDependsOnTrackableIds)];
    if (dependsOnTrackableIds.length === 0) {
      return dependsOnTrackableIds;
    }

    if (trackableId && dependsOnTrackableIds.includes(trackableId)) {
      throw new BadRequestException(EVENT_TRACKABLE_SELF_DEPENDENCY_MESSAGE);
    }

    const eventTrackables = await this.prisma.eventTrackable.findMany({
      where: { eventId },
      select: { id: true },
    });
    const eventTrackableIds = new Set(eventTrackables.map((t) => t.id));
    const allBelongToEvent = dependsOnTrackableIds.every((id) =>
      eventTrackableIds.has(id),
    );
    if (!allBelongToEvent) {
      throw new BadRequestException(
        EVENT_TRACKABLE_DEPENDENCY_NOT_IN_EVENT_MESSAGE,
      );
    }

    if (trackableId) {
      const existingEdges = await this.prisma.eventTrackableDependency.findMany(
        {
          where: { trackable: { eventId } },
          select: { trackableId: true, dependsOnTrackableId: true },
        },
      );
      const adjacency = new Map<string, string[]>();
      for (const edge of existingEdges) {
        const list = adjacency.get(edge.trackableId) ?? [];
        list.push(edge.dependsOnTrackableId);
        adjacency.set(edge.trackableId, list);
      }

      for (const candidateId of dependsOnTrackableIds) {
        if (this.canReach(candidateId, trackableId, adjacency)) {
          throw new ConflictException(
            EVENT_TRACKABLE_CIRCULAR_DEPENDENCY_MESSAGE,
          );
        }
      }
    }

    return dependsOnTrackableIds;
  }

  // BFS over the existing "depends on" edges — true if targetId is
  // reachable from startId, meaning adding startId as a dependency of
  // targetId would close a cycle.
  private canReach(
    startId: string,
    targetId: string,
    adjacency: Map<string, string[]>,
  ): boolean {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) {
        return true;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      for (const next of adjacency.get(current) ?? []) {
        queue.push(next);
      }
    }
    return false;
  }

  private async getTrackableInEventOrThrow(
    trackableId: string,
    eventId: string,
  ) {
    const trackable = await this.prisma.eventTrackable.findUnique({
      where: { id: trackableId },
    });
    if (!trackable || trackable.eventId !== eventId) {
      throw new NotFoundException(EVENT_TRACKABLE_NOT_FOUND_MESSAGE);
    }
    return trackable;
  }

  private toListItem(
    trackable: EventTrackableWithDependencies,
  ): EventTrackableListItem {
    return {
      id: trackable.id,
      eventId: trackable.eventId,
      name: trackable.name,
      description: trackable.description,
      redemptionCount: trackable._count.redemptions,
      dependencies: trackable.dependencies.map((dependency) => ({
        id: dependency.dependsOnTrackable.id,
        name: dependency.dependsOnTrackable.name,
      })),
      createdAt: trackable.createdAt,
      updatedAt: trackable.updatedAt,
    };
  }
}
