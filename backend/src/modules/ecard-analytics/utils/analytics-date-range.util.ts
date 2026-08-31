import type { EcardAnalyticsQueryDto } from '../dto/ecard-analytics-query.dto';
import { ECARD_ANALYTICS_DEFAULT_RANGE_DAYS } from '../ecard-analytics.constants';

const MS_PER_DAY = 86_400_000;

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function endOfUtcDay(date: Date): Date {
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

/**
 * Resolves an analytics `{ from?, to? }` query into a concrete UTC-day-snapped
 * window. Defaults to the last {@link ECARD_ANALYTICS_DEFAULT_RANGE_DAYS} days
 * ending today when either bound is omitted. Shared by every analytics
 * surface so day bucketing lines up across them.
 */
export function resolveAnalyticsDateRange(query: EcardAnalyticsQueryDto): {
  from: Date;
  to: Date;
} {
  const to = query.to
    ? endOfUtcDay(new Date(query.to))
    : endOfUtcDay(new Date());
  const from = query.from
    ? startOfUtcDay(new Date(query.from))
    : startOfUtcDay(
        new Date(
          to.getTime() - (ECARD_ANALYTICS_DEFAULT_RANGE_DAYS - 1) * MS_PER_DAY,
        ),
      );
  return { from, to };
}

/** Every UTC day key from `from` to `to` inclusive, in order. */
export function eachUtcDayKey(from: Date, to: Date): string[] {
  const keys: string[] = [];
  for (
    let cursor = new Date(from);
    cursor <= to;
    cursor = new Date(cursor.getTime() + MS_PER_DAY)
  ) {
    keys.push(utcDayKey(cursor));
  }
  return keys;
}
