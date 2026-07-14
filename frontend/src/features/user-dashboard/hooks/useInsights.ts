import { useMemo } from "react";
import type { Lead } from "@features/user-dashboard/types";
import {
  INSIGHTS_MONTHS_COUNT,
  INSIGHTS_DAYS_COUNT,
  RECENT_LEADS_MAX,
} from "@features/user-dashboard/config";

interface MonthlyBucket {
  label: string;
  total: number;
}

interface WeeklyBucket {
  label: string;
  total: number;
}

interface InsightsResult {
  todayLeads: number;
  totalLeads: number;
  thisWeekLeads: number;
  thisMonthLeads: number;
  lastMonthLeads: number;
  monthTrend: "up" | "down" | "neutral";
  monthlyBuckets: MonthlyBucket[];
  weeklyBuckets: WeeklyBucket[];
  recentLeads: Lead[];
}

const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SHORT_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function useInsights(leads: Lead[]): InsightsResult {
  return useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayLeads = 0;
    let thisWeekLeads = 0;
    let thisMonthLeads = 0;
    let lastMonthLeads = 0;

    for (const lead of leads) {
      const createdAt = new Date(lead.createdAt);
      if (createdAt >= todayStart) todayLeads++;
      if (createdAt >= weekStart) thisWeekLeads++;
      if (createdAt >= thisMonthStart) thisMonthLeads++;
      if (createdAt >= lastMonthStart && createdAt < lastMonthEnd)
        lastMonthLeads++;
    }

    let monthTrend: "up" | "down" | "neutral" = "neutral";
    if (thisMonthLeads > lastMonthLeads) monthTrend = "up";
    else if (thisMonthLeads < lastMonthLeads) monthTrend = "down";

    // Monthly buckets (last N months)
    const monthlyBuckets: MonthlyBucket[] = [];
    for (let i = INSIGHTS_MONTHS_COUNT - 1; i >= 0; i--) {
      const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const bucketEnd = new Date(
        bucketDate.getFullYear(),
        bucketDate.getMonth() + 1,
        1,
      );
      const total = leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= bucketDate && d < bucketEnd;
      }).length;
      monthlyBuckets.push({
        label: SHORT_MONTH_LABELS[bucketDate.getMonth()],
        total,
      });
    }

    // Weekly buckets (last N days)
    const weeklyBuckets: WeeklyBucket[] = [];
    for (let i = INSIGHTS_DAYS_COUNT - 1; i >= 0; i--) {
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i,
      );
      const dayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i + 1,
      );
      const total = leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= dayStart && d < dayEnd;
      }).length;
      weeklyBuckets.push({
        label: SHORT_DAY_LABELS[dayStart.getDay()],
        total,
      });
    }

    // Recent leads sorted newest first
    const recentLeads = [...leads]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, RECENT_LEADS_MAX);

    return {
      todayLeads,
      totalLeads: leads.length,
      thisWeekLeads,
      thisMonthLeads,
      lastMonthLeads,
      monthTrend,
      monthlyBuckets,
      weeklyBuckets,
      recentLeads,
    };
  }, [leads]);
}
