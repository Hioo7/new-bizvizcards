import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SmartCardTemplateKey } from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { EventAccessService } from './event-access.service';
import { EventScanningService } from './event-scanning.service';
import { EventsService } from './events.service';

describe('EventScanningService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let eventsService: EventsService;
  let service: EventScanningService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEventIds: string[] = [];
  const seededEcardIds: string[] = [];
  const seededSmartCardIds: string[] = [];

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
    service = new EventScanningService(prisma, eventAccessService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededEcardIds.length > 0) {
      await prisma.eCard.deleteMany({ where: { id: { in: seededEcardIds } } });
      seededEcardIds.length = 0;
    }
    if (seededSmartCardIds.length > 0) {
      await prisma.smartCard.deleteMany({
        where: { id: { in: seededSmartCardIds } },
      });
      seededSmartCardIds.length = 0;
    }
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
        email: `event-scanning-service-${randomUUID()}@example.com`,
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

  async function seedEcard(customerId: string) {
    const ecard = await prisma.eCard.create({
      data: {
        customerId,
        endpoint: `event-scan-ecard-${randomUUID()}`,
        heroName: 'Test',
        heroEmail: 'test@example.com',
      },
    });
    seededEcardIds.push(ecard.id);
    return ecard;
  }

  async function seedSmartCard(customerId: string | null) {
    const template = await prisma.smartCardTemplate.findFirstOrThrow({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
    });
    const smartCard = await prisma.smartCard.create({
      data: {
        customerId,
        templateId: template.id,
        endpoint: `event-scan-smartcard-${randomUUID()}`,
      },
    });
    seededSmartCardIds.push(smartCard.id);
    return smartCard;
  }

  describe('resolveCardOwner', () => {
    it('resolves an ECard endpoint to its owning customerId', async () => {
      const customer = await seedCustomer();
      const ecard = await seedEcard(customer.id);

      const customerId = await service.resolveCardOwner({
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });

      expect(customerId).toBe(customer.id);
    });

    it('resolves a claimed SmartCard endpoint to its owning customerId', async () => {
      const customer = await seedCustomer();
      const smartCard = await seedSmartCard(customer.id);

      const customerId = await service.resolveCardOwner({
        cardType: 'SMART_CARD',
        endpoint: smartCard.endpoint,
      });

      expect(customerId).toBe(customer.id);
    });

    it('rejects an unclaimed SmartCard', async () => {
      const smartCard = await seedSmartCard(null);

      await expect(
        service.resolveCardOwner({
          cardType: 'SMART_CARD',
          endpoint: smartCard.endpoint,
        }),
      ).rejects.toThrow(
        'This card has no owner and cannot be used as a ticket',
      );
    });

    it('throws when the endpoint does not resolve to any card', async () => {
      await expect(
        service.resolveCardOwner({
          cardType: 'ECARD',
          endpoint: 'no-such-endpoint',
        }),
      ).rejects.toThrow('Card not found');
    });
  });

  describe('scanGate', () => {
    it('checks in a whitelisted guest', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const ecard = await seedEcard(guestCustomer.id);

      const result = await service.scanGate(event.id, host.id, {
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });

      expect(result.customerId).toBe(guestCustomer.id);
      expect(result.checkedInAt).toBeInstanceOf(Date);
    });

    it('rejects a non-whitelisted customer', async () => {
      const { host, event } = await seedEventWithHost();
      const outsider = await seedCustomer('Outsider');
      const ecard = await seedEcard(outsider.id);

      await expect(
        service.scanGate(event.id, host.id, {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        }),
      ).rejects.toThrow(
        'This customer is not on the guest list for this event',
      );
    });

    it('rejects a second scan of an already-checked-in guest', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const ecard = await seedEcard(guestCustomer.id);
      await service.scanGate(event.id, host.id, {
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });

      await expect(
        service.scanGate(event.id, host.id, {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        }),
      ).rejects.toThrow('This guest has already checked in');
    });
  });

  describe('scanTrackable', () => {
    it('redeems a trackable for a whitelisted guest who never gate-scanned', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const trackable = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'Food Coupon' },
      });
      const ecard = await seedEcard(guestCustomer.id);

      const result = await service.scanTrackable(
        event.id,
        trackable.id,
        host.id,
        { cardType: 'ECARD', endpoint: ecard.endpoint },
      );

      expect(result.customerId).toBe(guestCustomer.id);
    });

    it('rejects redeeming the same trackable twice for the same guest', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const trackable = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'Food Coupon' },
      });
      const ecard = await seedEcard(guestCustomer.id);
      await service.scanTrackable(event.id, trackable.id, host.id, {
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });

      await expect(
        service.scanTrackable(event.id, trackable.id, host.id, {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        }),
      ).rejects.toThrow('This guest has already redeemed this trackable');
    });

    it('rejects a non-whitelisted customer', async () => {
      const { host, event } = await seedEventWithHost();
      const outsider = await seedCustomer('Outsider');
      const trackable = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'Food Coupon' },
      });
      const ecard = await seedEcard(outsider.id);

      await expect(
        service.scanTrackable(event.id, trackable.id, host.id, {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        }),
      ).rejects.toThrow(
        'This customer is not on the guest list for this event',
      );
    });
  });

  describe('scanTrackable with chained dependencies', () => {
    it('blocks redemption until the required dependency has been redeemed', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const mainGate = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'Main Gate Entrance' },
      });
      const foodCoupon = await prisma.eventTrackable.create({
        data: {
          eventId: event.id,
          name: 'Food Coupon',
          dependencies: {
            create: { dependsOnTrackableId: mainGate.id },
          },
        },
      });
      const ecard = await seedEcard(guestCustomer.id);

      await expect(
        service.scanTrackable(event.id, foodCoupon.id, host.id, {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        }),
      ).rejects.toThrow('This guest must first redeem: Main Gate Entrance');

      await service.scanTrackable(event.id, mainGate.id, host.id, {
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });

      const result = await service.scanTrackable(
        event.id,
        foodCoupon.id,
        host.id,
        { cardType: 'ECARD', endpoint: ecard.endpoint },
      );
      expect(result.customerId).toBe(guestCustomer.id);
    });

    it('requires every dependency, not just one (AND semantics)', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const mainGate = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'Main Gate Entrance' },
      });
      const vipPass = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'VIP Pass' },
      });
      const afterParty = await prisma.eventTrackable.create({
        data: {
          eventId: event.id,
          name: 'After Party',
          dependencies: {
            create: [
              { dependsOnTrackableId: mainGate.id },
              { dependsOnTrackableId: vipPass.id },
            ],
          },
        },
      });
      const ecard = await seedEcard(guestCustomer.id);

      // Only one of the two dependencies redeemed — still blocked.
      await service.scanTrackable(event.id, mainGate.id, host.id, {
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });
      await expect(
        service.scanTrackable(event.id, afterParty.id, host.id, {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        }),
      ).rejects.toThrow('This guest must first redeem: VIP Pass');

      // Both redeemed — now succeeds.
      await service.scanTrackable(event.id, vipPass.id, host.id, {
        cardType: 'ECARD',
        endpoint: ecard.endpoint,
      });
      const result = await service.scanTrackable(
        event.id,
        afterParty.id,
        host.id,
        { cardType: 'ECARD', endpoint: ecard.endpoint },
      );
      expect(result.customerId).toBe(guestCustomer.id);
    });

    it('behaves exactly as before for a trackable with no dependencies', async () => {
      const { host, event } = await seedEventWithHost();
      const guestCustomer = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guestCustomer.id },
      });
      const trackable = await prisma.eventTrackable.create({
        data: { eventId: event.id, name: 'Standalone Trackable' },
      });
      const ecard = await seedEcard(guestCustomer.id);

      const result = await service.scanTrackable(
        event.id,
        trackable.id,
        host.id,
        {
          cardType: 'ECARD',
          endpoint: ecard.endpoint,
        },
      );

      expect(result.customerId).toBe(guestCustomer.id);
    });
  });
});
