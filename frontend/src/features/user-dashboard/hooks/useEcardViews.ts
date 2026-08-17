import { useEffect, useState } from "react";
import type { Ecard } from "@app-types/ecard";
import {
  getCustomerEcardAnalytics,
  getCustomerEcardTotalViews,
} from "@services/customerEcardService";
import { getInsightsDateBoundaries } from "@features/user-dashboard/utils/dateBoundaries";

interface UseEcardViewsResult {
  todayViews: number;
  totalViews: number;
  thisWeekViews: number;
  thisMonthViews: number;
  viewsTrend: "up" | "down" | "neutral";
  loading: boolean;
  error: string | null;
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function useEcardViews(
  ecards: Ecard[],
  selectedEcardId: string | null,
): UseEcardViewsResult {
  const [result, setResult] = useState<
    Omit<UseEcardViewsResult, "loading" | "error">
  >({
    todayViews: 0,
    totalViews: 0,
    thisWeekViews: 0,
    thisMonthViews: 0,
    viewsTrend: "neutral",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ecardIds = selectedEcardId
      ? [selectedEcardId]
      : ecards.map((ecard) => ecard.id);

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (ecardIds.length === 0) {
          if (!cancelled) {
            setResult({
              todayViews: 0,
              totalViews: 0,
              thisWeekViews: 0,
              thisMonthViews: 0,
              viewsTrend: "neutral",
            });
          }
          return;
        }

        const { now, todayStart, weekStart, thisMonthStart, lastMonthStart, lastMonthEnd } =
          getInsightsDateBoundaries();
        const range = {
          from: toDateParam(lastMonthStart),
          to: toDateParam(now),
        };

        const [summaries, totalViewsResults] = await Promise.all([
          Promise.all(
            ecardIds.map((id) => getCustomerEcardAnalytics(id, range)),
          ),
          Promise.all(ecardIds.map((id) => getCustomerEcardTotalViews(id))),
        ]);

        const viewsByDate = new Map<string, number>();
        for (const summary of summaries) {
          for (const day of summary.dailyCounts) {
            viewsByDate.set(
              day.date,
              (viewsByDate.get(day.date) ?? 0) + day.views,
            );
          }
        }

        let todayViews = 0;
        let thisWeekViews = 0;
        let thisMonthViews = 0;
        let lastMonthViews = 0;
        for (const [dateStr, views] of viewsByDate) {
          const date = new Date(`${dateStr}T00:00:00`);
          if (date >= todayStart) todayViews += views;
          if (date >= weekStart) thisWeekViews += views;
          if (date >= thisMonthStart) thisMonthViews += views;
          if (date >= lastMonthStart && date < lastMonthEnd)
            lastMonthViews += views;
        }

        let viewsTrend: "up" | "down" | "neutral" = "neutral";
        if (thisMonthViews > lastMonthViews) viewsTrend = "up";
        else if (thisMonthViews < lastMonthViews) viewsTrend = "down";

        const totalViews = totalViewsResults.reduce(
          (sum, r) => sum + r.totalViews,
          0,
        );

        if (!cancelled) {
          setResult({
            todayViews,
            totalViews,
            thisWeekViews,
            thisMonthViews,
            viewsTrend,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load view stats",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ecards, selectedEcardId]);

  return { ...result, loading, error };
}
