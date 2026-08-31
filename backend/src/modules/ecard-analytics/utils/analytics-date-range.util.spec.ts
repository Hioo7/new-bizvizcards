import { ECARD_ANALYTICS_DEFAULT_RANGE_DAYS } from '../ecard-analytics.constants';
import {
  eachUtcDayKey,
  resolveAnalyticsDateRange,
  utcDayKey,
} from './analytics-date-range.util';

describe('resolveAnalyticsDateRange', () => {
  it('defaults to the last ECARD_ANALYTICS_DEFAULT_RANGE_DAYS days ending today (UTC)', () => {
    const { from, to } = resolveAnalyticsDateRange({});

    expect(utcDayKey(to)).toBe(new Date().toISOString().slice(0, 10));
    expect(eachUtcDayKey(from, to)).toHaveLength(
      ECARD_ANALYTICS_DEFAULT_RANGE_DAYS,
    );
    expect(from.getUTCHours()).toBe(0);
    expect(to.getUTCHours()).toBe(23);
  });

  it('snaps an explicit from/to to UTC day start and end', () => {
    const { from, to } = resolveAnalyticsDateRange({
      from: '2026-02-01',
      to: '2026-02-10',
    });

    expect(from.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-02-10T23:59:59.999Z');
  });
});

describe('eachUtcDayKey', () => {
  it('lists every day key from start to end inclusive', () => {
    const { from, to } = resolveAnalyticsDateRange({
      from: '2026-02-01',
      to: '2026-02-04',
    });

    expect(eachUtcDayKey(from, to)).toEqual([
      '2026-02-01',
      '2026-02-02',
      '2026-02-03',
      '2026-02-04',
    ]);
  });
});
