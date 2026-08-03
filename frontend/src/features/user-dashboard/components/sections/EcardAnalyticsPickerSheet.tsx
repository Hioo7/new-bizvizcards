import { Check, Layers, UserRound } from "lucide-react";
import type { Ecard } from "@app-types/ecard";

interface EcardAnalyticsPickerSheetProps {
  open: boolean;
  ecards: Ecard[];
  selectedEcardId: string | null;
  onSelect: (ecardId: string | null) => void;
  onClose: () => void;
}

export default function EcardAnalyticsPickerSheet({
  open,
  ecards,
  selectedEcardId,
  onSelect,
  onClose,
}: EcardAnalyticsPickerSheetProps) {
  if (!open) return null;

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div
        className="modal-box p-0 overflow-hidden flex flex-col rounded-t-3xl rounded-b-none w-full max-w-full sm:max-w-lg sm:mx-auto sm:rounded-3xl"
        style={{ maxHeight: "75vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-base-300" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-3 border-b border-base-200">
          <div>
            <p className="text-base font-bold text-base-content">Switch e-card</p>
            <p className="text-xs text-base-content/50 mt-0.5">
              Choose which e-card's analytics to view
            </p>
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

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
              selectedEcardId === null
                ? "border-primary/40 bg-primary/10"
                : "border-base-200 bg-base-100 hover:bg-base-200"
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/50">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <p className="text-sm font-bold text-base-content">All e-cards</p>
              <p className="text-xs text-base-content/50">Combined analytics</p>
            </span>
            {selectedEcardId === null && (
              <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            )}
          </button>

          {ecards.map((ecard) => {
            const isSelected = selectedEcardId === ecard.id;
            return (
              <button
                key={ecard.id}
                type="button"
                onClick={() => onSelect(ecard.id)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-base-200 bg-base-100 hover:bg-base-200"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-200">
                  {ecard.hero.profilePhotoUrl ? (
                    <img
                      src={ecard.hero.profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-5 w-5 text-base-content/30" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-base-content">
                    {ecard.hero.name}
                  </p>
                  <p className="truncate text-xs text-base-content/50">/{ecard.endpoint}</p>
                </span>
                {isSelected && (
                  <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
