export interface InsightsDateBoundaries {
  now: Date;
  todayStart: Date;
  weekStart: Date;
  thisMonthStart: Date;
  lastMonthStart: Date;
  lastMonthEnd: Date;
}

export function getInsightsDateBoundaries(): InsightsDateBoundaries {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  return { now, todayStart, weekStart, thisMonthStart, lastMonthStart, lastMonthEnd };
}
