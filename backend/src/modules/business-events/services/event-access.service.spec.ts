import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EventMemberRole } from '../../../generated/prisma/client';
import { EventAccessService } from './event-access.service';

describe('EventAccessService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: EventAccessService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEventIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new EventAccessService(prisma);
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
        email: `event-access-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEventWithHost() {
    const host = await seedCustomer('Host');
    const event = await prisma.businessEvent.create({
      data: { name: 'Test Event', startAt: new Date() },
    });
    seededEventIds.push(event.id);
    await prisma.eventMember.create({
      data: {
        eventId: event.id,
        customerId: host.id,
        role: EventMemberRole.HOST,
      },
    });
    return { host, event };
  }

  async function addMember(
    eventId: string,
    role: EventMemberRole,
    name = 'Member',
  ) {
    const customer = await seedCustomer(name);
    await prisma.eventMember.create({
      data: { eventId, customerId: customer.id, role },
    });
    return customer;
  }

  describe('assertCanManageCoHosts', () => {
    it('allows the host', async () => {
      const { host, event } = await seedEventWithHost();
      await expect(
        service.assertCanManageCoHosts(host.id, event.id),
      ).resolves.toBeUndefined();
    });

    it('rejects a co-host', async () => {
      const { event } = await seedEventWithHost();
      const coHost = await addMember(event.id, EventMemberRole.CO_HOST);
      await expect(
        service.assertCanManageCoHosts(coHost.id, event.id),
      ).rejects.toThrow(
        'Only the event host or an employee can manage co-hosts',
      );
    });

    it('rejects a volunteer', async () => {
      const { event } = await seedEventWithHost();
      const volunteer = await addMember(event.id, EventMemberRole.VOLUNTEER);
      await expect(
        service.assertCanManageCoHosts(volunteer.id, event.id),
      ).rejects.toThrow();
    });

    it('rejects a non-member', async () => {
      const { event } = await seedEventWithHost();
      const outsider = await seedCustomer('Outsider');
      await expect(
        service.assertCanManageCoHosts(outsider.id, event.id),
      ).rejects.toThrow();
    });
  });

  describe('assertCanManageVolunteers', () => {
    it('allows the host', async () => {
      const { host, event } = await seedEventWithHost();
      await expect(
        service.assertCanManageVolunteers(host.id, event.id),
      ).resolves.toBeUndefined();
    });

    it('allows a co-host', async () => {
      const { event } = await seedEventWithHost();
      const coHost = await addMember(event.id, EventMemberRole.CO_HOST);
      await expect(
        service.assertCanManageVolunteers(coHost.id, event.id),
      ).resolves.toBeUndefined();
    });

    it('rejects a volunteer', async () => {
      const { event } = await seedEventWithHost();
      const volunteer = await addMember(event.id, EventMemberRole.VOLUNTEER);
      await expect(
        service.assertCanManageVolunteers(volunteer.id, event.id),
      ).rejects.toThrow();
    });
  });

  describe('assertCanManageGuests / assertCanManageTrackables', () => {
    it('allows the host and a co-host, rejects a volunteer', async () => {
      const { host, event } = await seedEventWithHost();
      const coHost = await addMember(event.id, EventMemberRole.CO_HOST);
      const volunteer = await addMember(event.id, EventMemberRole.VOLUNTEER);

      await expect(
        service.assertCanManageGuests(host.id, event.id),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageGuests(coHost.id, event.id),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageGuests(volunteer.id, event.id),
      ).rejects.toThrow();

      await expect(
        service.assertCanManageTrackables(host.id, event.id),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageTrackables(coHost.id, event.id),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageTrackables(volunteer.id, event.id),
      ).rejects.toThrow();
    });
  });

  describe('assertCanScan', () => {
    it('allows host, co-host, and volunteer', async () => {
      const { host, event } = await seedEventWithHost();
      const coHost = await addMember(event.id, EventMemberRole.CO_HOST);
      const volunteer = await addMember(event.id, EventMemberRole.VOLUNTEER);

      await expect(
        service.assertCanScan(host.id, event.id),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanScan(coHost.id, event.id),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanScan(volunteer.id, event.id),
      ).resolves.toBeUndefined();
    });

    it('rejects a non-member', async () => {
      const { event } = await seedEventWithHost();
      const outsider = await seedCustomer('Outsider');
      await expect(
        service.assertCanScan(outsider.id, event.id),
      ).rejects.toThrow(
        "Only the event's host, a co-host, or a volunteer can scan",
      );
    });
  });
});
