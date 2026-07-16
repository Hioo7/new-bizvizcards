import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EventMemberRole } from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { EventAccessService } from './event-access.service';
import { EventMembersService } from './event-members.service';
import { EventsService } from './events.service';

describe('EventMembersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let eventsService: EventsService;
  let eventAccessService: EventAccessService;
  let service: EventMembersService;
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
    eventAccessService = new EventAccessService(prisma);
    eventsService = new EventsService(
      prisma,
      planEnforcementService,
      eventAccessService,
    );
    service = new EventMembersService(
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
        email: `event-members-service-${randomUUID()}@example.com`,
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

  describe('addAsHostOrCoHost', () => {
    it('lets the host add a co-host', async () => {
      const { host, event } = await seedEventWithHost();
      const target = await seedCustomer('New Co-Host');

      const member = await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: target.id,
        role: EventMemberRole.CO_HOST,
      });

      expect(member.role).toBe(EventMemberRole.CO_HOST);
      expect(member.customerId).toBe(target.id);
    });

    it('lets a co-host add a volunteer', async () => {
      const { host, event } = await seedEventWithHost();
      const coHostCustomer = await seedCustomer('Co-Host');
      await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: coHostCustomer.id,
        role: EventMemberRole.CO_HOST,
      });
      const volunteerCustomer = await seedCustomer('Volunteer');

      const member = await service.addAsHostOrCoHost(
        coHostCustomer.id,
        event.id,
        {
          customerId: volunteerCustomer.id,
          role: EventMemberRole.VOLUNTEER,
        },
      );

      expect(member.role).toBe(EventMemberRole.VOLUNTEER);
    });

    it('rejects a co-host trying to add another co-host', async () => {
      const { host, event } = await seedEventWithHost();
      const coHostCustomer = await seedCustomer('Co-Host');
      await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: coHostCustomer.id,
        role: EventMemberRole.CO_HOST,
      });
      const anotherCustomer = await seedCustomer('Another');

      await expect(
        service.addAsHostOrCoHost(coHostCustomer.id, event.id, {
          customerId: anotherCustomer.id,
          role: EventMemberRole.CO_HOST,
        }),
      ).rejects.toThrow(
        'Only the event host or an employee can manage co-hosts',
      );
    });

    it('rejects adding a customer who is already a member', async () => {
      const { host, event } = await seedEventWithHost();

      await expect(
        service.addAsHostOrCoHost(host.id, event.id, {
          customerId: host.id,
          role: EventMemberRole.CO_HOST,
        }),
      ).rejects.toThrow('This customer is already a member of this event');
    });

    it('rejects adding a customerId that does not exist', async () => {
      const { host, event } = await seedEventWithHost();

      await expect(
        service.addAsHostOrCoHost(host.id, event.id, {
          customerId: randomUUID(),
          role: EventMemberRole.CO_HOST,
        }),
      ).rejects.toThrow('customerId does not reference an existing customer');
    });
  });

  describe('removeAsHostOrCoHost', () => {
    it('rejects removing the HOST role entirely', async () => {
      const { host, event } = await seedEventWithHost();
      const hostMembership = await prisma.eventMember.findUniqueOrThrow({
        where: {
          customerId_eventId: { customerId: host.id, eventId: event.id },
        },
      });

      await expect(
        service.removeAsHostOrCoHost(host.id, event.id, hostMembership.id),
      ).rejects.toThrow('The event host cannot be removed or reassigned');
    });

    it('lets the host remove a co-host', async () => {
      const { host, event } = await seedEventWithHost();
      const coHostCustomer = await seedCustomer('Co-Host');
      const added = await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: coHostCustomer.id,
        role: EventMemberRole.CO_HOST,
      });

      await service.removeAsHostOrCoHost(host.id, event.id, added.id);

      const found = await prisma.eventMember.findUnique({
        where: { id: added.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('addAsEmployee / removeAsEmployee', () => {
    it('adds and removes a member without any customer permission check', async () => {
      const { event } = await seedEventWithHost();
      const target = await seedCustomer('Employee-Added Volunteer');

      const member = await service.addAsEmployee(event.id, {
        customerId: target.id,
        role: EventMemberRole.VOLUNTEER,
      });
      expect(member.role).toBe(EventMemberRole.VOLUNTEER);

      await service.removeAsEmployee(event.id, member.id);
      const found = await prisma.eventMember.findUnique({
        where: { id: member.id },
      });
      expect(found).toBeNull();
    });
  });
});
