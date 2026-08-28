import { useState } from "react";
import { useEcardAnalytics } from "@features/user-dashboard/hooks/useEcardAnalytics";

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
      <rect x="2" y="5" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ExchangeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface EcardStatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function EcardStatCard({ label, value, icon }: EcardStatCardProps) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </div>
      <p className="text-2xl font-bold text-base-content">{value}</p>
      <p className="text-xs text-base-content/60">{label}</p>
    </div>
  );
}

function formatAvgDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function EcardInsightsSection() {
  const { data, loading, error } = useEcardAnalytics();
  const [chartMetric, setChartMetric] = useState<"views" | "walletSaves" | "contactSaves" | "exchangeContacts">("views");

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error mt-4">
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const hasActivity = data.totalViews + data.totalWalletSaves + data.totalContactSaves + data.totalExchangeContacts > 0;

  const metricLabels: Record<typeof chartMetric, string> = {
    views: "Views",
    walletSaves: "Wallet Saves",
    contactSaves: "Contact Saves",
    exchangeContacts: "Exchanges",
  };

  const buckets = data.dailyCounts.slice(-30);
  const maxVal = Math.max(...buckets.map((b) => b[chartMetric]), 1);

  return (
    <div className="flex flex-col gap-4 pt-4">
      <h2 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
        E-Card Analytics · Last 30 Days
      </h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <EcardStatCard label="Total Views" value={data.totalViews} icon={<ViewIcon />} />
        <EcardStatCard label="Wallet Saves" value={data.totalWalletSaves} icon={<WalletIcon />} />
        <EcardStatCard label="Contact Saves" value={data.totalContactSaves} icon={<ContactIcon />} />
        <EcardStatCard label="Exchanges" value={data.totalExchangeContacts} icon={<ExchangeIcon />} />
      </div>

      {/* Avg view duration */}
      {data.averageViewDurationMs !== null && (
        <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-base-content">
              {formatAvgDuration(data.averageViewDurationMs)}
            </p>
            <p className="text-xs text-base-content/60">Avg. view duration</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {hasActivity ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-base-content">Activity</h3>
            <div className="flex rounded-xl bg-base-200 p-1 gap-0.5">
              {(["views", "walletSaves", "contactSaves", "exchangeContacts"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                    chartMetric === m
                      ? "bg-base-100 text-base-content shadow-sm"
                      : "text-base-content/50"
                  }`}
                  onClick={() => setChartMetric(m)}
                >
                  {metricLabels[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex h-32 items-end gap-0.5">
            {buckets.map((bucket) => {
              const pct = Math.round((bucket[chartMetric] / maxVal) * 100);
              return (
                <div
                  key={bucket.date}
                  className="flex flex-1 flex-col items-center gap-1"
                  title={`${formatDay(bucket.date)}: ${bucket[chartMetric]}`}
                >
                  <div className="flex w-full flex-col items-center justify-end" style={{ height: "100px" }}>
                    <div
                      className="w-full min-h-[4px] rounded-t-md bg-primary transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between">
            {buckets.length > 0 && (
              <>
                <span className="text-[10px] text-base-content/40">{formatDay(buckets[0].date)}</span>
                <span className="text-[10px] text-base-content/40">{formatDay(buckets[buckets.length - 1].date)}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 py-10 text-center shadow-sm">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-base-content/30" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-base-content/60">No ecard activity yet</p>
          <p className="mt-1 text-xs text-base-content/40">Share your ecard to start tracking views</p>
        </div>
      )}
    </div>
  );
}
