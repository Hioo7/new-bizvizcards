import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EventMemberRole } from '../../../generated/prisma/client';
import { EVENT_TRACKABLE_MAX_DEPENDENCIES } from '../business-events.constants';
import { createEventTrackableSchema } from '../dto/create-event-trackable.dto';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { EventAccessService } from './event-access.service';
import { EventTrackablesService } from './event-trackables.service';
import { EventsService } from './events.service';

describe('EventTrackablesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let eventsService: EventsService;
  let service: EventTrackablesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEventIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const resolver = new PlanPolicyResolverService(prisma);
    const planEnforcementService = new PlanEnforcementService(prisma, resolver);
    const eventAccessService = new EventAccessService(prisma);
    eventsService = new EventsService(
      prisma,
      planEnforcementService,
      eventAccessService,
    );
    service = new EventTrackablesService(
      prisma,
      eventsService,
      eventAccessService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededEventIds.length > 0) {
      await prisma.businessEvent.deleteMany({
        where: { id: { in: seededEventIds } },
      });
      seededEventIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `event-trackables-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEventWithHost() {
    const host = await seedCustomer('Host');
    const event = await eventsService.create(host.id, {
      name: 'Test Event',
      startAt: new Date(),
    });
    seededEventIds.push(event.id);
    return { host, event };
  }

  describe('createAsHostOrCoHost', () => {
    it('creates a trackable with zero redemptions', async () => {
      const { host, event } = await seedEventWithHost();

      const trackable = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Food Coupon',
      });

      expect(trackable.name).toBe('Food Coupon');
      expect(trackable.redemptionCount).toBe(0);
    });

    it('rejects a volunteer trying to create a trackable', async () => {
      const { event } = await seedEventWithHost();
      const volunteer = await seedCustomer('Volunteer');
      await prisma.eventMember.create({
        data: {
          eventId: event.id,
          customerId: volunteer.id,
          role: EventMemberRole.VOLUNTEER,
        },
      });

      await expect(
        service.createAsHostOrCoHost(volunteer.id, event.id, {
          name: 'Gift',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateAsHostOrCoHost / removeAsHostOrCoHost', () => {
    it('updates and then removes a trackable', async () => {
      const { host, event } = await seedEventWithHost();
      const trackable = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Gift',
      });

      const updated = await service.updateAsHostOrCoHost(
        host.id,
        event.id,
        trackable.id,
        { name: 'Premium Gift' },
      );
      expect(updated.name).toBe('Premium Gift');

      await service.removeAsHostOrCoHost(host.id, event.id, trackable.id);
      const found = await prisma.eventTrackable.findUnique({
        where: { id: trackable.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('listByEventId', () => {
    it('reports redemption counts', async () => {
      const { host, event } = await seedEventWithHost();
      const trackable = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Coupon',
      });
      const guestCustomer = await seedCustomer('Guest');
      const guest = await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      await prisma.eventTrackableRedemption.create({
        data: {
          trackableId: trackable.id,
          eventGuestId: guest.id,
          scannedByCustomerId: host.id,
        },
      });

      const list = await service.listByEventId(event.id);

      expect(list.find((t) => t.id === trackable.id)?.redemptionCount).toBe(1);
    });
  });

  describe('chained trackables (dependsOnTrackableIds)', () => {
    it('creates a trackable that depends on another and reports it back', async () => {
      const { host, event } = await seedEventWithHost();
      const mainGate = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Main Gate Entrance',
      });

      const foodCoupon = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Food Coupon',
        dependsOnTrackableIds: [mainGate.id],
      });

      expect(foodCoupon.dependencies).toEqual([
        { id: mainGate.id, name: 'Main Gate Entrance' },
      ]);
    });

    it('rejects a dependency that belongs to a different event', async () => {
      const { host, event } = await seedEventWithHost();
      const { host: otherHost, event: otherEvent } = await seedEventWithHost();
      const otherTrackable = await service.createAsHostOrCoHost(
        otherHost.id,
        otherEvent.id,
        { name: 'Other Event Trackable' },
      );

      await expect(
        service.createAsHostOrCoHost(host.id, event.id, {
          name: 'Food Coupon',
          dependsOnTrackableIds: [otherTrackable.id],
        }),
      ).rejects.toThrow(
        'A trackable can only depend on other trackables from the same event',
      );
    });

    it('rejects a self-dependency on update', async () => {
      const { host, event } = await seedEventWithHost();
      const trackable = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Main Gate Entrance',
      });

      await expect(
        service.updateAsHostOrCoHost(host.id, event.id, trackable.id, {
          dependsOnTrackableIds: [trackable.id],
        }),
      ).rejects.toThrow('A trackable cannot depend on itself');
    });

    it('rejects a direct 2-cycle', async () => {
      const { host, event } = await seedEventWithHost();
      const a = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'A',
      });
      const b = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'B',
        dependsOnTrackableIds: [a.id],
      });

      await expect(
        service.updateAsHostOrCoHost(host.id, event.id, a.id, {
          dependsOnTrackableIds: [b.id],
        }),
      ).rejects.toThrow(
        'This dependency would create a circular chain between trackables',
      );
    });

    it('rejects a longer 3-cycle', async () => {
      const { host, event } = await seedEventWithHost();
      const a = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'A',
      });
      const b = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'B',
        dependsOnTrackableIds: [a.id],
      });
      const c = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'C',
        dependsOnTrackableIds: [b.id],
      });

      await expect(
        service.updateAsHostOrCoHost(host.id, event.id, a.id, {
          dependsOnTrackableIds: [c.id],
        }),
      ).rejects.toThrow(
        'This dependency would create a circular chain between trackables',
      );
    });

    it('full-replaces the dependency list on update, not a merge', async () => {
      const { host, event } = await seedEventWithHost();
      const first = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'First',
      });
      const second = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Second',
      });
      const dependent = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Dependent',
        dependsOnTrackableIds: [first.id],
      });

      const updated = await service.updateAsHostOrCoHost(
        host.id,
        event.id,
        dependent.id,
        { dependsOnTrackableIds: [second.id] },
      );

      expect(updated.dependencies).toEqual([{ id: second.id, name: 'Second' }]);
    });

    it('clears all dependencies when given an empty array', async () => {
      const { host, event } = await seedEventWithHost();
      const first = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'First',
      });
      const dependent = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Dependent',
        dependsOnTrackableIds: [first.id],
      });

      const updated = await service.updateAsHostOrCoHost(
        host.id,
        event.id,
        dependent.id,
        { dependsOnTrackableIds: [] },
      );

      expect(updated.dependencies).toEqual([]);
    });

    it('leaves dependencies untouched when dependsOnTrackableIds is omitted', async () => {
      const { host, event } = await seedEventWithHost();
      const first = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'First',
      });
      const dependent = await service.createAsHostOrCoHost(host.id, event.id, {
        name: 'Dependent',
        dependsOnTrackableIds: [first.id],
      });

      const updated = await service.updateAsHostOrCoHost(
        host.id,
        event.id,
        dependent.id,
        { name: 'Dependent Renamed' },
      );

      expect(updated.name).toBe('Dependent Renamed');
      expect(updated.dependencies).toEqual([{ id: first.id, name: 'First' }]);
    });

    it('rejects a dependency list larger than EVENT_TRACKABLE_MAX_DEPENDENCIES via the DTO', () => {
      const oversized = Array.from(
        { length: EVENT_TRACKABLE_MAX_DEPENDENCIES + 1 },
        () => randomUUID(),
      );

      const result = createEventTrackableSchema.safeParse({
        name: 'Too Many Dependencies',
        dependsOnTrackableIds: oversized,
      });

      expect(result.success).toBe(false);
    });
  });
});
