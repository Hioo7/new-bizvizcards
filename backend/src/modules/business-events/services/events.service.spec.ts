import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  EventMemberRole,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { EventAccessService } from './event-access.service';
import { EventsService } from './events.service';

describe('EventsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: EventsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];
  const seededEventIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const resolver = new PlanPolicyResolverService(prisma);
    const planEnforcementService = new PlanEnforcementService(prisma, resolver);
    const eventAccessService = new EventAccessService(prisma);
    service = new EventsService(
      prisma,
      planEnforcementService,
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
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `events-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEmployee() {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Test Employee',
        email: `events-service-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(account.id);
    return prisma.employee.create({ data: { accountId: account.id } });
  }

  async function seedTightPlan(maxEvents: number) {
    const plan = await prisma.plan.create({
      data: {
        name: `Tight Plan ${randomUUID()}`,
        price: 0,
        businessModelType: PlanBusinessModelType.ONE_TIME,
        policy: {
          create: {
            ecardPolicy: {
              create: {
                isAvailable: true,
                maxEcards: 0,
                exchangeContactAccess: false,
              },
            },
            smartCardPolicy: {
              create: {
                isAvailable: true,
                maxSmartCards: 0,
                exchangeContactAccess: false,
              },
            },
            organisationPolicy: {
              create: {
                isAvailable: true,
                maxOrgsCanJoin: 0,
                maxOrgsCanCreate: 0,
                orgEcardPolicy: {
                  create: {
                    isAvailable: true,
                    maxEcards: 0,
                    exchangeContactAccess: false,
                  },
                },
                orgSmartCardPolicy: {
                  create: {
                    isAvailable: true,
                    maxSmartCards: 0,
                    exchangeContactAccess: false,
                  },
                },
              },
            },
            eventPolicy: {
              create: { isAvailable: true, maxEvents, maxGuestsPerEvent: 5 },
            },
          },
        },
      },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  async function assignPlan(customerId: string, planId: string) {
    const employee = await seedEmployee();
    await prisma.customer.update({
      where: { id: customerId },
      data: { currentPlanId: planId },
    });
    await prisma.planPurchaseHistory.create({
      data: {
        customerId,
        planId,
        assignedByEmployeeId: employee.id,
        expiresAt: null,
        businessModelTypeAtPurchase: PlanBusinessModelType.ONE_TIME,
      },
    });
  }

  describe('create', () => {
    it('creates the event and auto-adds the host as an EventMember{role: HOST}', async () => {
      const host = await seedCustomer('Host Person');

      const event = await service.create(host.id, {
        name: 'Annual Gala',
        startAt: new Date('2026-08-01T18:00:00Z'),
      });
      seededEventIds.push(event.id);

      expect(event.hostCustomerId).toBe(host.id);
      expect(event.hostName).toBe('Host Person');
      expect(event.createdByEmployeeId).toBeNull();

      const membership = await prisma.eventMember.findUniqueOrThrow({
        where: {
          customerId_eventId: { customerId: host.id, eventId: event.id },
        },
      });
      expect(membership.role).toBe(EventMemberRole.HOST);
    });

    it('createAsEmployee sets createdByEmployeeId and the given customer as host', async () => {
      const host = await seedCustomer('Delegated Host');
      const employee = await seedEmployee();

      const event = await service.createAsEmployee(
        {
          customerId: host.id,
          name: 'Employee-Created Event',
          startAt: new Date(),
        },
        employee.accountId,
      );
      seededEventIds.push(event.id);

      expect(event.hostCustomerId).toBe(host.id);
      expect(event.createdByEmployeeId).toBe(employee.id);
    });

    it('blocks creating once the host is at their plan event cap', async () => {
      const host = await seedCustomer();
      const plan = await seedTightPlan(1);
      await assignPlan(host.id, plan.id);
      const first = await service.create(host.id, {
        name: 'First Event',
        startAt: new Date(),
      });
      seededEventIds.push(first.id);

      await expect(
        service.create(host.id, { name: 'Second Event', startAt: new Date() }),
      ).rejects.toThrow("This customer's plan has reached its event limit");
    });
  });

  describe('listForCustomer / listAllForEmployee', () => {
    it('scopes to only events the customer is a member of', async () => {
      const host = await seedCustomer('Scoped Host');
      const outsider = await seedCustomer('Outsider');
      const event = await service.create(host.id, {
        name: 'Scoped Event',
        startAt: new Date(),
      });
      seededEventIds.push(event.id);

      const hostList = await service.listForCustomer(host.id, {
        page: 1,
        pageSize: 20,
      });
      const outsiderList = await service.listForCustomer(outsider.id, {
        page: 1,
        pageSize: 20,
      });

      expect(hostList.events.some((e) => e.id === event.id)).toBe(true);
      expect(outsiderList.events.some((e) => e.id === event.id)).toBe(false);
    });

    it('search filters by name (case-insensitive substring)', async () => {
      const host = await seedCustomer();
      const event = await service.create(host.id, {
        name: `Findable-${randomUUID()}`,
        startAt: new Date(),
      });
      seededEventIds.push(event.id);

      const result = await service.listAllForEmployee({
        search: 'findable',
        page: 1,
        pageSize: 20,
      });

      expect(result.events.some((e) => e.id === event.id)).toBe(true);
    });
  });

  describe('getByIdOrThrow / getByIdForCustomerOrThrow', () => {
    it('throws when the event does not exist', async () => {
      await expect(service.getByIdOrThrow(randomUUID())).rejects.toThrow(
        'Event not found',
      );
    });

    it('rejects a customer who is not a member of the event', async () => {
      const host = await seedCustomer();
      const outsider = await seedCustomer('Outsider');
      const event = await service.create(host.id, {
        name: 'Private Event',
        startAt: new Date(),
      });
      seededEventIds.push(event.id);

      await expect(
        service.getByIdForCustomerOrThrow(outsider.id, event.id),
      ).rejects.toThrow('Event not found');
    });
  });

  describe('updateAsHost / removeAsHost', () => {
    it('lets the host update event details', async () => {
      const host = await seedCustomer();
      const event = await service.create(host.id, {
        name: 'Original Name',
        startAt: new Date(),
      });
      seededEventIds.push(event.id);

      const updated = await service.updateAsHost(host.id, event.id, {
        name: 'Renamed',
      });

      expect(updated.name).toBe('Renamed');
    });

    it('rejects a co-host trying to update event details', async () => {
      const host = await seedCustomer();
      const coHost = await seedCustomer('Co-Host');
      const event = await service.create(host.id, {
        name: 'Event',
        startAt: new Date(),
      });
      seededEventIds.push(event.id);
      await prisma.eventMember.create({
        data: {
          eventId: event.id,
          customerId: coHost.id,
          role: EventMemberRole.CO_HOST,
        },
      });

      await expect(
        service.updateAsHost(coHost.id, event.id, { name: 'Hijacked' }),
      ).rejects.toThrow();
    });

    it('removeAsHost deletes the event and cascades its members', async () => {
      const host = await seedCustomer();
      const event = await service.create(host.id, {
        name: 'To Delete',
        startAt: new Date(),
      });

      await service.removeAsHost(host.id, event.id);

      const found = await prisma.businessEvent.findUnique({
        where: { id: event.id },
      });
      expect(found).toBeNull();
      const members = await prisma.eventMember.findMany({
        where: { eventId: event.id },
      });
      expect(members).toHaveLength(0);
    });
  });
});
