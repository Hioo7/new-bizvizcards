import { useVirtualBackgroundInsights } from "@features/user-dashboard/hooks/useVirtualBackgroundInsights";
import type { VirtualBackgroundAnalyticsRow } from "@app-types/virtualBackground";
import StatCard from "./StatCard";

interface VirtualBackgroundInsightsProps {
  accessible: boolean;
  selectedEcardId: string | null;
}

function ViewsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BackgroundRow({ row }: { row: VirtualBackgroundAnalyticsRow }) {
  return (
    <div className="flex items-center gap-3">
      <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-lg border border-base-300 bg-base-200">
        <img
          src={row.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-base-content">
          {row.captionText?.trim() || "Virtual background"}
        </p>
        <p className="text-xs text-base-content/50">
          Added {formatShortDate(row.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-4 text-right">
        <div>
          <p className="text-sm font-bold text-base-content">{row.views}</p>
          <p className="text-[10px] text-base-content/50">views</p>
        </div>
        <div>
          <p className="text-sm font-bold text-base-content">
            {row.exchangeContacts}
          </p>
          <p className="text-[10px] text-base-content/50">contacts</p>
        </div>
      </div>
    </div>
  );
}

export default function VirtualBackgroundInsights({
  accessible,
  selectedEcardId,
}: VirtualBackgroundInsightsProps) {
  const { data, loading, error } = useVirtualBackgroundInsights(accessible);

  if (!accessible) return null;

  const rows = selectedEcardId
    ? (data?.perBackground.filter((row) => row.ecardId === selectedEcardId) ?? [])
    : (data?.perBackground ?? []);

  const totals = rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      exchangeContacts: acc.exchangeContacts + row.exchangeContacts,
    }),
    { views: 0, exchangeContacts: 0 },
  );

  return (
    <div className="mb-4">
      <h2 className="mb-3 text-sm font-bold text-base-content">
        Virtual Backgrounds
      </h2>

      {error && (
        <div className="alert alert-error mb-3">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-28 w-full rounded-2xl" />
          <div className="skeleton h-28 w-full rounded-2xl" />
        </div>
      ) : !error && data ? (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <StatCard
              label="Views"
              value={totals.views}
              icon={<ViewsIcon />}
              tooltip="E-card views from people who scanned a virtual background's QR code, last 30 days."
            />
            <StatCard
              label="Contacts exchanged"
              value={totals.exchangeContacts}
              icon={<ContactsIcon />}
              tooltip="People who exchanged contact after arriving via a virtual background, last 30 days."
            />
          </div>

          {rows.length > 0 ? (
            <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <BackgroundRow key={row.virtualBackgroundId} row={row} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 py-10 text-center shadow-sm">
              <p className="text-sm font-medium text-base-content/60">
                {selectedEcardId
                  ? "No virtual backgrounds for this e-card"
                  : "No virtual backgrounds yet"}
              </p>
              <p className="mt-1 text-xs text-base-content/40">
                Create one from Apps to start tracking scans
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
