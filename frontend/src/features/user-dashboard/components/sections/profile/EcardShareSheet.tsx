import { ecardPublicPath } from "@config/routes";
import EcardShareContent from "./EcardShareContent";

interface EcardShareSheetProps {
  open: boolean;
  cardName: string;
  endpoint: string;
  onClose: () => void;
}

export default function EcardShareSheet({
  open,
  cardName,
  endpoint,
  onClose,
}: EcardShareSheetProps) {
  const url = `${window.location.origin}${ecardPublicPath(endpoint)}`;

  if (!open) return null;

  return (
    <dialog className="modal modal-bottom" open>
      <div className="modal-box p-0 overflow-hidden flex flex-col rounded-t-3xl rounded-b-none w-full max-w-none h-[90dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-base-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
          <p className="text-base font-bold text-base-content">Share Card</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-base-200 text-base-content/40 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Share content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EcardShareContent url={url} cardName={cardName} endpoint={endpoint} />
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
