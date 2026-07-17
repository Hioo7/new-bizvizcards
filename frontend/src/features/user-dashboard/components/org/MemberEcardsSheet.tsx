import type { OrgMemberListItem } from "@features/user-dashboard/types";
import { ecardPublicPath } from "@config/routes";

interface MemberEcardsSheetProps {
  open: boolean;
  member: OrgMemberListItem | null;
  onClose: () => void;
  onEditEcard: (member: OrgMemberListItem) => void;
}

export default function MemberEcardsSheet({
  open,
  member,
  onClose,
  onEditEcard,
}: MemberEcardsSheetProps) {
  if (!open || !member) return null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const ecard = member.linkedEcard;

  function handleView() {
    if (!ecard) return;
    window.open(ecardPublicPath(ecard.endpoint), "_blank", "noopener,noreferrer");
  }

  async function handleShare() {
    if (!ecard) return;
    const url = `${window.location.origin}${ecardPublicPath(ecard.endpoint)}`;
    const lines = [ecard.heroName, member?.email].filter(Boolean);
    const text = lines.join(" · ");
    if (navigator.share) {
      try {
        await navigator.share({ title: ecard.heroName, text, url });
      } catch {
        // user dismissed
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }

  return (
    <dialog className="modal modal-bottom" open>
      {/* Sheet — fixed to 75vh */}
      <div className="modal-box p-0 overflow-hidden flex flex-col rounded-t-3xl rounded-b-none w-full max-w-full sm:max-w-lg sm:mx-auto" style={{ maxHeight: "75vh" }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-base-300" />
        </div>

        {/* Member header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-base-200">
          {member.profilePicture ? (
            <img
              src={member.profilePicture}
              alt={member.name}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-base-content truncate">{member.name}</p>
            <p className="text-xs text-base-content/50 truncate">{member.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-base-content/40"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Section title */}
        <div className="shrink-0 px-5 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
            E-Cards ({ecard ? "1" : "0"})
          </p>
        </div>

        {/* Scrollable ecard list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
          {ecard ? (
            <div className="rounded-2xl border border-base-200 bg-base-100 shadow-sm">
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-base-content truncate">{ecard.heroName}</p>
                  <p className="text-xs text-base-content/40">/{ecard.endpoint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { onEditEcard(member); onClose(); }}
                  aria-label="Edit e-card"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-primary/60 hover:text-primary transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-3 py-0.5 text-xs font-semibold text-success">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  E-Card On
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-semibold ${
                    ecard.isExchangeContactEnabled
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-base-300 bg-base-200 text-base-content/40"
                  }`}
                >
                  {ecard.isExchangeContactEnabled ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                  Exchange {ecard.isExchangeContactEnabled ? "On" : "Off"}
                </span>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-1 border-t border-base-100 bg-base-50 px-4 py-2">
                <button
                  type="button"
                  onClick={handleView}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  View
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-base-content/60 hover:bg-base-200 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-base-content/30" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-base-content/60">No e-card linked</p>
              <p className="mt-1 text-xs text-base-content/40">
                This member doesn't have an org e-card yet
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
