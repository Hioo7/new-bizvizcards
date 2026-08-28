import { useEffect } from "react";
import { Bell, BellOff, CreditCard, PenLine, ScanLine, Smartphone, X } from "lucide-react";
import { UserDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type { Lead, LeadSourceType } from "@features/user-dashboard/types";

interface NotificationsSheetProps {
  isOpen: boolean;
  leads: Lead[];
  onClose: () => void;
  onLeadClick: (lead: Lead) => void;
  onMarkSeen: () => void;
}

const service = new UserDashboardService();

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface SourceMeta {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}

const SOURCE_META: Record<LeadSourceType, SourceMeta> = {
  E_CARD: {
    label: "E-Card",
    Icon: CreditCard,
    bg: "bg-primary/10",
    text: "text-primary",
  },
  SMART_CARD: {
    label: "Smart Card",
    Icon: Smartphone,
    bg: "bg-secondary/10",
    text: "text-secondary",
  },
  CARD_SCANNER: {
    label: "Card Scanner",
    Icon: ScanLine,
    bg: "bg-info/10",
    text: "text-info",
  },
  MANUAL_ENTRY: {
    label: "Manual Entry",
    Icon: PenLine,
    bg: "bg-base-300",
    text: "text-base-content/60",
  },
};

export default function NotificationsSheet({
  isOpen,
  leads,
  onClose,
  onLeadClick,
  onMarkSeen,
}: NotificationsSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    service.markLeadsSeen().then(onMarkSeen).catch(() => {});
  }, [isOpen, onMarkSeen]);

  const unseenCount = leads.filter((l) => l.seenAt === null).length;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-base-100 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "75vh" }}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-base-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold">Notifications</h2>
            {unseenCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-content">
                {unseenCount} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-base-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-base-200">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-base-content/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
                <BellOff className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="mt-0.5 text-xs text-base-content/30">New leads will appear here</p>
              </div>
            </div>
          ) : (
            leads.map((lead) => {
              const meta = SOURCE_META[lead.sourcedBy];
              const { Icon } = meta;
              const isUnseen = lead.seenAt === null;

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => { onLeadClick(lead); onClose(); }}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-base-200 active:bg-base-200 ${
                    isUnseen ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Source icon avatar */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`truncate text-sm ${isUnseen ? "font-bold" : "font-semibold"}`}>
                        {lead.name}
                      </p>
                      <span className="shrink-0 text-xs text-base-content/40">
                        {timeAgo(lead.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-base-content/50">
                      New lead via <span className={`font-medium ${meta.text}`}>{meta.label}</span>
                      {lead.company ? ` · ${lead.company}` : ""}
                    </p>
                  </div>

                  {/* Unseen dot */}
                  {isUnseen && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="New" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
