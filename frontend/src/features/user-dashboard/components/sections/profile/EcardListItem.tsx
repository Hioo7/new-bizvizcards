import type { Ecard } from "@app-types/ecard";
import { ecardPublicPath } from "@config/routes";

interface EcardListItemProps {
  ecard: Ecard;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export default function EcardListItem({ ecard, onEdit, onDelete, onShare }: EcardListItemProps) {
  function handleView() {
    window.open(ecardPublicPath(ecard.endpoint), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onEdit}
        className="w-full flex items-center gap-3 px-4 pt-4 pb-3 text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
          {ecard.hero.profilePhotoUrl ? (
            <img
              src={ecard.hero.profilePhotoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-base-content/30" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-base-content">{ecard.hero.name}</p>
          <p className="truncate text-xs text-base-content/50">/{ecard.endpoint}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-base-content/30" aria-hidden="true">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="flex items-center justify-between border-t border-base-100 bg-base-50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleView}
            aria-label="View e-card"
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
            onClick={onShare}
            aria-label="Share e-card"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-base-content/60 hover:bg-base-200 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete e-card"
          className="flex h-8 w-8 items-center justify-center rounded-full text-error/60 hover:bg-error/10 hover:text-error transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
