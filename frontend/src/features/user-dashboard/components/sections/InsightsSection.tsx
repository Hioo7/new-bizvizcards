import { useState } from "react";
import type { Lead } from "@features/user-dashboard/types";
import { useInsights } from "@features/user-dashboard/hooks/useInsights";

interface InsightsSectionProps {
  leads: Lead[];
  loading: boolean;
  error: string | null;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function TodayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
    </svg>
  );
}

function TotalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  );
}

function WeekIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary" aria-hidden="true">
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
  );
}

function MonthIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  );
}

function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        {trend && trend !== "neutral" && (
          <span
            className={`badge badge-sm ${
              trend === "up" ? "badge-success" : "badge-error"
            }`}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-base-content">{value}</p>
      <p className="text-xs text-base-content/60">{label}</p>
    </div>
  );
}

interface BarChartProps {
  buckets: { label: string; total: number }[];
}

function BarChart({ buckets }: BarChartProps) {
  const maxVal = Math.max(...buckets.map((b) => b.total), 1);
  return (
    <div className="flex h-32 items-end gap-1">
      {buckets.map((bucket) => {
        const pct = Math.round((bucket.total / maxVal) * 100);
        return (
          <div
            key={bucket.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex w-full flex-col items-center justify-end" style={{ height: "100px" }}>
              <div
                className="w-full min-h-[4px] rounded-t-md bg-primary transition-all"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-[10px] text-base-content/50">
              {bucket.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function InsightsSection({
  leads,
  loading,
  error,
}: InsightsSectionProps) {
  const [chartView, setChartView] = useState<"monthly" | "weekly">("monthly");

  const {
    todayLeads,
    totalLeads,
    thisWeekLeads,
    thisMonthLeads,
    monthTrend,
    monthlyBuckets,
    weeklyBuckets,
    recentLeads,
  } = useInsights(leads);

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 pb-5 pt-10"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/70">Your leads overview</p>
      </div>

      <div className="px-4 pt-4">
        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="skeleton h-28 w-full rounded-2xl"
                />
              ))}
            </div>
            <div className="skeleton h-48 w-full rounded-2xl" />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stat cards 2×2 */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <StatCard
                label="Today"
                value={todayLeads}
                icon={<TodayIcon />}
              />
              <StatCard
                label="Total"
                value={totalLeads}
                icon={<TotalIcon />}
              />
              <StatCard
                label="This Week"
                value={thisWeekLeads}
                icon={<WeekIcon />}
              />
              <StatCard
                label="This Month"
                value={thisMonthLeads}
                icon={<MonthIcon />}
                trend={monthTrend}
              />
            </div>

            {/* Chart */}
            {leads.length > 0 ? (
              <div className="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                {/* Toggle */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-base-content">
                    Lead Activity
                  </h2>
                  <div className="flex rounded-xl bg-base-200 p-1">
                    <button
                      type="button"
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        chartView === "monthly"
                          ? "bg-base-100 text-base-content shadow-sm"
                          : "text-base-content/50"
                      }`}
                      onClick={() => setChartView("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        chartView === "weekly"
                          ? "bg-base-100 text-base-content shadow-sm"
                          : "text-base-content/50"
                      }`}
                      onClick={() => setChartView("weekly")}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                <BarChart
                  buckets={
                    chartView === "monthly" ? monthlyBuckets : weeklyBuckets
                  }
                />
              </div>
            ) : (
              <div className="mb-4 flex flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 py-12 text-center shadow-sm">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7 text-base-content/30"
                    aria-hidden="true"
                  >
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-base-content/60">
                  No data yet
                </p>
                <p className="mt-1 text-xs text-base-content/40">
                  Add leads to see your analytics
                </p>
              </div>
            )}

            {/* Recent Leads */}
            {recentLeads.length > 0 && (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-base-content">
                  Recent Leads
                </h2>
                <div className="flex flex-col gap-3">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
                        {getInitials(lead.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-base-content">
                          {lead.name}
                        </p>
                        {lead.email && (
                          <p className="truncate text-xs text-base-content/50">
                            {lead.email}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-base-content/40">
                        {formatShortDate(lead.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
