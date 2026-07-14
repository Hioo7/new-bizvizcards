import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ECardEventType } from '../../../generated/prisma/client';
import { EcardAnalyticsService } from './ecard-analytics.service';

describe('EcardAnalyticsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: EcardAnalyticsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new EcardAnalyticsService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedEcard(): Promise<string> {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `ecard-analytics-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    const customer = await prisma.customer.create({
      data: { accountId: account.id },
    });
    const card = await prisma.eCard.create({
      data: {
        customerId: customer.id,
        endpoint: `ecard-analytics-${randomUUID()}`,
        heroName: account.name,
        heroEmail: account.email,
      },
    });
    return card.id;
  }

  async function seedEvent(
    ecardId: string,
    type: ECardEventType,
    createdAt: Date,
    durationMs?: number,
  ): Promise<string> {
    const event = await prisma.eCardEvent.create({
      data: { ecardId, type, createdAt, durationMs },
    });
    return event.id;
  }

  function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 86_400_000);
  }

  describe('recordEvent', () => {
    it('persists an event row with the given ecardId and type, and returns its id', async () => {
      const ecardId = await seedEcard();

      const result = await service.recordEvent(ecardId, ECardEventType.VIEW);

      const events = await prisma.eCardEvent.findMany({ where: { ecardId } });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECardEventType.VIEW);
      expect(result.id).toBe(events[0].id);
    });
  });

  describe('recordViewDuration', () => {
    it('sets durationMs on the matching VIEW event', async () => {
      const ecardId = await seedEcard();
      const eventId = await seedEvent(ecardId, ECardEventType.VIEW, new Date());

      await service.recordViewDuration(ecardId, eventId, 4200);

      const event = await prisma.eCardEvent.findUniqueOrThrow({
        where: { id: eventId },
      });
      expect(event.durationMs).toBe(4200);
    });

    it('throws NotFoundException for a non-existent event id', async () => {
      const ecardId = await seedEcard();

      await expect(
        service.recordViewDuration(ecardId, randomUUID(), 1000),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the event belongs to a different ecard', async () => {
      const ecardId = await seedEcard();
      const otherEcardId = await seedEcard();
      const eventId = await seedEvent(
        otherEcardId,
        ECardEventType.VIEW,
        new Date(),
      );

      await expect(
        service.recordViewDuration(ecardId, eventId, 1000),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a non-VIEW event', async () => {
      const ecardId = await seedEcard();
      const eventId = await seedEvent(
        ecardId,
        ECardEventType.WALLET_SAVE,
        new Date(),
      );

      await expect(
        service.recordViewDuration(ecardId, eventId, 1000),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('returns zero totals and an all-zero bucket series for an ecard with no events', async () => {
      const ecardId = await seedEcard();

      const summary = await service.getSummary(ecardId, {});

      expect(summary.totalViews).toBe(0);
      expect(summary.totalWalletSaves).toBe(0);
      expect(summary.totalContactSaves).toBe(0);
      expect(summary.totalExchangeContacts).toBe(0);
      expect(summary.averageViewDurationMs).toBeNull();
      expect(summary.dailyCounts.length).toBeGreaterThan(0);
      expect(
        summary.dailyCounts.every(
          (day) =>
            day.views === 0 &&
            day.walletSaves === 0 &&
            day.contactSaves === 0 &&
            day.exchangeContacts === 0,
        ),
      ).toBe(true);
    });

    it('totals every event type seeded within range, bucketed by day', async () => {
      const ecardId = await seedEcard();
      await seedEvent(ecardId, ECardEventType.VIEW, daysAgo(1));
      await seedEvent(ecardId, ECardEventType.VIEW, daysAgo(1));
      await seedEvent(ecardId, ECardEventType.WALLET_SAVE, daysAgo(2));
      await seedEvent(ecardId, ECardEventType.CONTACT_SAVE, daysAgo(1));
      await seedEvent(ecardId, ECardEventType.EXCHANGE_CONTACT, daysAgo(2));

      const today = new Date().toISOString().slice(0, 10);
      const twoDaysAgo = daysAgo(2).toISOString().slice(0, 10);
      const summary = await service.getSummary(ecardId, {
        from: twoDaysAgo,
        to: today,
      });

      expect(summary.totalViews).toBe(2);
      expect(summary.totalWalletSaves).toBe(1);
      expect(summary.totalContactSaves).toBe(1);
      expect(summary.totalExchangeContacts).toBe(1);
      const dayOneBucket = summary.dailyCounts.find(
        (day) => day.date === daysAgo(1).toISOString().slice(0, 10),
      );
      const dayTwoBucket = summary.dailyCounts.find(
        (day) => day.date === twoDaysAgo,
      );
      expect(dayOneBucket).toEqual({
        date: daysAgo(1).toISOString().slice(0, 10),
        views: 2,
        walletSaves: 0,
        contactSaves: 1,
        exchangeContacts: 0,
      });
      expect(dayTwoBucket).toEqual({
        date: twoDaysAgo,
        views: 0,
        walletSaves: 1,
        contactSaves: 0,
        exchangeContacts: 1,
      });
    });

    it('excludes events outside the requested range', async () => {
      const ecardId = await seedEcard();
      await seedEvent(ecardId, ECardEventType.VIEW, daysAgo(10));

      const today = new Date().toISOString().slice(0, 10);
      const summary = await service.getSummary(ecardId, {
        from: today,
        to: today,
      });

      expect(summary.totalViews).toBe(0);
    });

    it('computes averageViewDurationMs across VIEW events that have a duration, ignoring ones that do not', async () => {
      const ecardId = await seedEcard();
      await seedEvent(ecardId, ECardEventType.VIEW, new Date(), 1000);
      await seedEvent(ecardId, ECardEventType.VIEW, new Date(), 3000);
      // No duration reported yet for this view — must not skew the average.
      await seedEvent(ecardId, ECardEventType.VIEW, new Date());

      const summary = await service.getSummary(ecardId, {});

      expect(summary.averageViewDurationMs).toBe(2000);
    });

    it('defaults to the last ECARD_ANALYTICS_DEFAULT_RANGE_DAYS days when from/to are omitted', async () => {
      const ecardId = await seedEcard();
      await seedEvent(ecardId, ECardEventType.VIEW, daysAgo(5));
      await seedEvent(ecardId, ECardEventType.VIEW, daysAgo(40));

      const summary = await service.getSummary(ecardId, {});

      expect(summary.totalViews).toBe(1);
    });
  });
});
