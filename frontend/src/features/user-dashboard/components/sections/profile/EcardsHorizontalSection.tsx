import { useState } from "react";
import type { Ecard } from "@app-types/ecard";
import { ecardPublicPath } from "@config/routes";
import EcardShareSheet from "./EcardShareSheet";

interface EcardsHorizontalSectionProps {
  ecards: Ecard[];
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  onCreateNew: () => void;
  onEdit: (ecard: Ecard) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function EcardsHorizontalSection({
  ecards,
  loading,
  error,
  isAvailable,
  onCreateNew,
  onEdit,
  onDelete,
}: EcardsHorizontalSectionProps) {
  const [shareEcard, setShareEcard] = useState<Ecard | null>(null);

  function handleView(ecard: Ecard) {
    window.open(ecardPublicPath(ecard.endpoint), "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-base-content">My E-Cards</p>
            {!loading && (
              <p className="text-xs text-base-content/50">
                {ecards.length} {ecards.length === 1 ? "e-card" : "e-cards"}
              </p>
            )}
          </div>
        </div>
        {isAvailable && (
          <button
            type="button"
            onClick={onCreateNew}
            aria-label="Create new e-card"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Locked — not available on current plan */}
      {!isAvailable && (
        <div className="rounded-2xl bg-base-100 shadow-sm border border-base-300 flex flex-col items-center justify-center py-8 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-base-content/30" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-base-content/60">Not available on your plan</p>
            <p className="mt-0.5 text-xs text-base-content/40">Upgrade your plan to create e-cards</p>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isAvailable && loading && (
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3" style={{ scrollbarWidth: "none" }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton rounded-3xl flex-shrink-0 w-[78vw] sm:w-auto sm:flex-shrink" style={{ aspectRatio: "1.586 / 1" }} />
          ))}
        </div>
      )}

      {isAvailable && !loading && error && (
        <div className="rounded-2xl bg-error/10 px-4 py-3 text-xs text-error">{error}</div>
      )}

      {isAvailable && !loading && !error && ecards.length === 0 && (
        <div className="rounded-2xl bg-base-100 shadow-sm flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-base-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-base-content/30" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-xs font-medium text-base-content/60">No e-cards yet</p>
          <p className="mt-0.5 text-xs text-base-content/40">Tap + to create your first e-card</p>
        </div>
      )}

      {/* Cards */}
      {isAvailable && !loading && !error && ecards.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
          style={{ scrollbarWidth: "none" }}
        >
          {ecards.map((ecard) => (
            <div
              key={ecard.id}
              className="relative rounded-3xl overflow-hidden flex flex-col flex-shrink-0 snap-center w-[78vw] sm:w-auto sm:flex-shrink"
              style={{
                aspectRatio: "1.586 / 1",
                background: "linear-gradient(160deg, #f4f6ff 0%, #ffffff 60%)",
                boxShadow: "0 4px 24px -4px color-mix(in oklch, var(--color-primary) 18%, transparent), 0 1px 4px rgba(0,0,0,0.06)",
                border: "1px solid rgba(255,255,255,0.9)",
              }}
            >
              {/* ── Diagonal gloss panel (right side, like reference) ── */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(125deg, transparent 38%, rgba(255,255,255,0.72) 54%, rgba(248,250,255,0.45) 68%, transparent 85%)",
                }}
              />

              {/* ── Subtle primary tint bottom-left ── */}
              <div
                className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 12%, white) 0%, transparent 70%)",
                }}
              />

              {/* ── Card face (tap to edit) ── */}
              <button
                type="button"
                onClick={() => onEdit(ecard)}
                className="relative z-10 flex-1 flex flex-col justify-between p-4 text-left w-full"
              >
                {/* Top row: chip logo + label */}
                <div className="flex items-start justify-between">
                  {/* Chip / logo block */}
                  <div
                    className="w-10 h-8 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, var(--color-primary) 0%, color-mix(in oklch, var(--color-primary) 70%, white) 100%)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary-content/80" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Top-right label */}
                  <span className="text-xs tracking-widest font-medium text-base-content/25 uppercase select-none">
                    BizViz
                  </span>
                </div>

                {/* Bottom: name + endpoint */}
                <div>
                  <p className="text-base font-bold text-base-content tracking-tight truncate">
                    {ecard.hero.name}
                  </p>
                  <p className="text-xs text-base-content/40 truncate mt-0.5 tracking-wide">
                    /{ecard.endpoint}
                  </p>
                </div>
              </button>

              {/* ── Action strip ── */}
              <div
                className="relative z-10 flex items-center"
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleView(ecard)}
                  aria-label="View e-card"
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/6 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  View
                </button>
                <div className="w-px h-4 bg-base-200" />
                <button
                  type="button"
                  onClick={() => setShareEcard(ecard)}
                  aria-label="Share e-card"
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-base-content/40 hover:text-base-content hover:bg-base-100/80 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Share
                </button>
                <div className="w-px h-4 bg-base-200" />
                <button
                  type="button"
                  onClick={() => onEdit(ecard)}
                  aria-label="Edit e-card"
                  className="flex items-center justify-center px-3 py-2.5 text-base-content/35 hover:text-primary hover:bg-primary/8 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="w-px h-4 bg-base-200" />
                <button
                  type="button"
                  onClick={() => void onDelete(ecard.id)}
                  aria-label="Delete e-card"
                  className="flex items-center justify-center px-3 py-2.5 text-base-content/20 hover:text-error hover:bg-error/8 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareEcard && (
        <EcardShareSheet
          open
          cardName={shareEcard.hero.name}
          endpoint={shareEcard.endpoint}
          onClose={() => setShareEcard(null)}
        />
      )}
    </div>
  );
}
