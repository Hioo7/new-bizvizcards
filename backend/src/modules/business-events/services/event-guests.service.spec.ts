import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlanBusinessModelType } from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { EventAccessService } from './event-access.service';
import { EventGuestsService } from './event-guests.service';
import { EventsService } from './events.service';

describe('EventGuestsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let eventsService: EventsService;
  let planEnforcementService: PlanEnforcementService;
  let service: EventGuestsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededEventIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const resolver = new PlanPolicyResolverService(prisma);
    planEnforcementService = new PlanEnforcementService(prisma, resolver);
    const eventAccessService = new EventAccessService(prisma);
    eventsService = new EventsService(
      prisma,
      planEnforcementService,
      eventAccessService,
    );
    service = new EventGuestsService(
      prisma,
      eventsService,
      eventAccessService,
      planEnforcementService,
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
        email: `event-guests-service-${randomUUID()}@example.com`,
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

  async function seedTightGuestPlan(maxGuestsPerEvent: number) {
    const plan = await prisma.plan.create({
      data: {
        name: `Tight Guest Plan ${randomUUID()}`,
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
              create: { isAvailable: true, maxEvents: 10, maxGuestsPerEvent },
            },
          },
        },
      },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  async function assignPlan(customerId: string, planId: string) {
    const employeeAccount = await prisma.employeeAccount.create({
      data: {
        name: 'Assigning Employee',
        email: `event-guests-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(employeeAccount.id);
    const employee = await prisma.employee.create({
      data: { accountId: employeeAccount.id },
    });
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

  describe('addAsHostOrCoHost', () => {
    it('adds a guest', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');

      const guest = await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: guestCustomer.id,
      });

      expect(guest.customerId).toBe(guestCustomer.id);
      expect(guest.checkedInAt).toBeNull();
    });

    it('rejects a duplicate guest', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: guestCustomer.id,
      });

      await expect(
        service.addAsHostOrCoHost(host.id, event.id, {
          customerId: guestCustomer.id,
        }),
      ).rejects.toThrow('This customer is already on the guest list');
    });

    it('blocks once the host is at their plan guest cap for this event', async () => {
      const host = await seedCustomer();
      const plan = await seedTightGuestPlan(1);
      await assignPlan(host.id, plan.id);
      const event = await eventsService.create(host.id, {
        name: 'Capped Event',
        startAt: new Date(),
      });
      seededEventIds.push(event.id);
      const firstGuest = await seedCustomer('Guest One');
      await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: firstGuest.id,
      });
      const secondGuest = await seedCustomer('Guest Two');

      await expect(
        service.addAsHostOrCoHost(host.id, event.id, {
          customerId: secondGuest.id,
        }),
      ).rejects.toThrow(
        "This event's host plan has reached its guest limit for this event",
      );
    });
  });

  describe('bulkAddAsEmployee', () => {
    it('adds every unique customerId in the batch', async () => {
      const { event } = await seedEventWithHost();
      const guestOne = await seedCustomer('Guest One');
      const guestTwo = await seedCustomer('Guest Two');

      const results = await service.bulkAddAsEmployee(event.id, {
        customerIds: [guestOne.id, guestTwo.id, guestOne.id],
      });

      expect(results).toHaveLength(2);
      const list = await service.listByEventId(event.id);
      expect(list.map((g) => g.customerId).sort()).toEqual(
        [guestOne.id, guestTwo.id].sort(),
      );
    });
  });

  describe('removeAsHostOrCoHost', () => {
    it('removes a guest', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      const guest = await service.addAsHostOrCoHost(host.id, event.id, {
        customerId: guestCustomer.id,
      });

      await service.removeAsHostOrCoHost(host.id, event.id, guest.id);

      const found = await prisma.eventGuest.findUnique({
        where: { id: guest.id },
      });
      expect(found).toBeNull();
    });
  });
});
