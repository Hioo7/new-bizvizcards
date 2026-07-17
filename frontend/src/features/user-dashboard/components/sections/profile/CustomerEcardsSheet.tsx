import { useState, useEffect } from "react";
import type { Ecard } from "@app-types/ecard";
import { ecardPublicPath } from "@config/routes";
import EcardListItem from "./EcardListItem";
import EcardShareContent from "./EcardShareContent";
import EcardShareSheet from "./EcardShareSheet";

interface CustomerEcardsSheetProps {
  open: boolean;
  ecards: Ecard[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onCreateNew: () => void;
  onEdit: (ecard: Ecard) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function CustomerEcardsSheet({
  open,
  ecards,
  loading,
  error,
  onClose,
  onCreateNew,
  onEdit,
  onDelete,
}: CustomerEcardsSheetProps) {
  const [shareEcard, setShareEcard] = useState<Ecard | null>(null);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!open) return null;

  const shareUrl = shareEcard
    ? `${window.location.origin}${ecardPublicPath(shareEcard.endpoint)}`
    : "";

  return (
    <>
      <dialog className="modal modal-bottom" open>
        {/* Two-panel box: stacked on mobile, side-by-side on desktop */}
        <div className="modal-box p-0 overflow-hidden flex flex-col sm:flex-row rounded-t-3xl rounded-b-none sm:rounded-3xl w-full max-w-none sm:w-[90vw] sm:max-w-5xl h-[90dvh] sm:h-[75dvh] sm:mx-auto sm:mb-8">

          {/* ── LEFT PANEL: My E-Cards ── */}
          <div className="flex flex-col w-full sm:w-96 sm:shrink-0 sm:border-r sm:border-base-200 h-full min-h-0">
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-base-300" />
            </div>

            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-base-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-base-content">My E-Cards</p>
                <p className="text-xs text-base-content/50">
                  {ecards.length} {ecards.length === 1 ? "e-card" : "e-cards"}
                </p>
              </div>
              <button
                type="button"
                onClick={onCreateNew}
                aria-label="Create new e-card"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
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

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {loading && (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-base-200 bg-base-100 p-4 flex items-center gap-3">
                      <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="skeleton h-4 w-28 rounded" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
              )}

              {!loading && !error && ecards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-base-content/30" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-base-content/60">No e-cards yet</p>
                  <p className="mt-1 text-xs text-base-content/40">Tap + above to create your first e-card</p>
                </div>
              )}

              {!loading && !error && ecards.map((ecard) => (
                <EcardListItem
                  key={ecard.id}
                  ecard={ecard}
                  onEdit={() => onEdit(ecard)}
                  onDelete={() => void onDelete(ecard.id)}
                  onShare={() => setShareEcard(ecard)}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL: Share (desktop only) ── */}
          <div className="hidden sm:flex flex-1 flex-col min-h-0">
            {shareEcard ? (
              <>
                {/* Share panel header */}
                <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-base-200">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-base-content">Share Card</p>
                    <p className="text-xs text-base-content/50 truncate">{shareEcard.hero.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareEcard(null)}
                    aria-label="Close share panel"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-base-content/40 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {/* Share content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <EcardShareContent
                    url={shareUrl}
                    cardName={shareEcard.hero.name}
                    endpoint={shareEcard.endpoint}
                  />
                </div>
              </>
            ) : (
              /* Empty state — prompt user to pick a card */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                  <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-base-content/30" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-base-content/50">Select a card to share</p>
                <p className="text-xs text-base-content/30">
                  Click "Share" on any e-card to see its QR code and sharing options here
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-backdrop" onClick={onClose} />
      </dialog>

      {/* Mobile share sheet — stacks on top when a card is selected on small screens */}
      {!isDesktop && shareEcard && (
        <EcardShareSheet
          open
          cardName={shareEcard.hero.name}
          endpoint={shareEcard.endpoint}
          onClose={() => setShareEcard(null)}
        />
      )}
    </>
  );
}
