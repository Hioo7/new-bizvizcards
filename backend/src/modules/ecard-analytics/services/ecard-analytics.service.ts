import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ECardEventType } from '../../../generated/prisma/client';
import type { EcardAnalyticsQueryDto } from '../dto/ecard-analytics-query.dto';
import { ECARD_ANALYTICS_DEFAULT_RANGE_DAYS } from '../ecard-analytics.constants';

type EventCounts = Record<
  'views' | 'walletSaves' | 'contactSaves' | 'exchangeContacts',
  number
>;

// Keeps the event-type -> summary-field mapping in one place — a Record over
// the full enum means TypeScript forces this to be updated (and nothing
// silently falls through uncounted) whenever a new ECardEventType is added.
const EVENT_TYPE_TO_COUNT_KEY: Record<ECardEventType, keyof EventCounts> = {
  [ECardEventType.VIEW]: 'views',
  [ECardEventType.WALLET_SAVE]: 'walletSaves',
  [ECardEventType.CONTACT_SAVE]: 'contactSaves',
  [ECardEventType.EXCHANGE_CONTACT]: 'exchangeContacts',
};

function emptyCounts(): EventCounts {
  return { views: 0, walletSaves: 0, contactSaves: 0, exchangeContacts: 0 };
}

export interface EcardAnalyticsDailyCount extends EventCounts {
  date: string;
}

export interface EcardAnalyticsSummary {
  totalViews: number;
  totalWalletSaves: number;
  totalContactSaves: number;
  totalExchangeContacts: number;
  averageViewDurationMs: number | null;
  dailyCounts: EcardAnalyticsDailyCount[];
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

@Injectable()
export class EcardAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(
    ecardId: string,
    type: ECardEventType,
  ): Promise<{ id: string }> {
    return this.prisma.eCardEvent.create({
      data: { ecardId, type },
      select: { id: true },
    });
  }

  async recordViewDuration(
    ecardId: string,
    eventId: string,
    durationMs: number,
  ): Promise<void> {
    const result = await this.prisma.eCardEvent.updateMany({
      where: { id: eventId, ecardId, type: ECardEventType.VIEW },
      data: { durationMs },
    });
    if (result.count === 0) {
      throw new NotFoundException('View event not found');
    }
  }

  async getSummary(
    ecardId: string,
    query: EcardAnalyticsQueryDto,
  ): Promise<EcardAnalyticsSummary> {
    const to = query.to
      ? endOfUtcDay(new Date(query.to))
      : endOfUtcDay(new Date());
    const from = query.from
      ? startOfUtcDay(new Date(query.from))
      : startOfUtcDay(
          new Date(
            to.getTime() -
              (ECARD_ANALYTICS_DEFAULT_RANGE_DAYS - 1) * 86_400_000,
          ),
        );

    const events = await this.prisma.eCardEvent.findMany({
      where: { ecardId, createdAt: { gte: from, lte: to } },
      select: { type: true, createdAt: true, durationMs: true },
      orderBy: { createdAt: 'asc' },
    });

    const totals = emptyCounts();
    const buckets = new Map<string, EventCounts>();
    for (
      let cursor = new Date(from);
      cursor <= to;
      cursor = new Date(cursor.getTime() + 86_400_000)
    ) {
      buckets.set(dateKey(cursor), emptyCounts());
    }

    let viewDurationSum = 0;
    let viewDurationCount = 0;
    for (const event of events) {
      const key = EVENT_TYPE_TO_COUNT_KEY[event.type];
      totals[key] += 1;
      const bucket = buckets.get(dateKey(event.createdAt));
      if (bucket) bucket[key] += 1;

      if (event.type === ECardEventType.VIEW && event.durationMs !== null) {
        viewDurationSum += event.durationMs;
        viewDurationCount += 1;
      }
    }

    const dailyCounts = [...buckets.entries()].map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return {
      totalViews: totals.views,
      totalWalletSaves: totals.walletSaves,
      totalContactSaves: totals.contactSaves,
      totalExchangeContacts: totals.exchangeContacts,
      averageViewDurationMs:
        viewDurationCount === 0
          ? null
          : Math.round(viewDurationSum / viewDurationCount),
      dailyCounts,
    };
  }
}
