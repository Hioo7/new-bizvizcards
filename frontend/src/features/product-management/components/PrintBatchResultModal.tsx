import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { Download, PackageCheck, TriangleAlert } from "lucide-react";
import type { PrintBatchResult } from "@app-types/product.types";
import { downloadPrintBatchCsv } from "@features/product-management/utils/downloadPrintBatchCsv";

interface PrintBatchResultModalProps {
  open: boolean;
  result: PrintBatchResult | null;
  onClose: () => void;
}

export default function PrintBatchResultModal({
  open,
  result,
  onClose,
}: PrintBatchResultModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // "close"/"cancel" are wired via addEventListener, not JSX onClose/onCancel
  // props: React's synthetic handling of these on <dialog> bubbles through
  // the *React* tree, and this opens while it's nested (in React terms)
  // inside the variant-management sheet's own <dialog> — if wired via JSX
  // props, that cross-bubbling would fire the sheet's onClose too, closing
  // it along with this one. addEventListener only ever fires for events
  // dispatched on this exact DOM node, which is what "close"/"cancel"
  // actually are (native, non-bubbling events). Escape is blocked here so
  // the codes can't be dismissed by accident before they're downloaded —
  // there's deliberately no backdrop-close form either: "Done" is the only
  // way out.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const blockCancel = (event: Event) => event.preventDefault();
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("cancel", blockCancel);
    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("cancel", blockCancel);
    };
  }, [onClose]);

  if (!result) return null;

  // Portaled to <body> — this opens while the variant-management sheet's own
  // <dialog> is still showModal()'d. Nesting one <dialog> inside another as
  // a DOM descendant is unreliable across browsers (closing the inner one
  // can take the outer one with it), so this renders as a top-level sibling
  // instead; showModal() already visually escapes normal layout via the
  // browser's top layer, so this changes nothing about where it appears.
  return createPortal(
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box flex max-h-[85vh] flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/10">
            <PackageCheck className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-base-content">
              {result.units.length} unit{result.units.length === 1 ? "" : "s"} ready to print
            </h3>
            <p className="text-xs text-base-content/50">
              These codes are marked printed and won&apos;t be reused in another batch.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-field border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Download this list now — once you close this, it won&apos;t be shown again.</p>
        </div>

        <button
          type="button"
          onClick={() => downloadPrintBatchCsv(result.printBatchId, result.units)}
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-field border border-base-300 bg-base-100 text-sm font-semibold text-base-content hover:bg-base-200"
        >
          <Download className="h-4 w-4" />
          Download CSV (code + URL)
        </button>

        <div className="mt-4 flex-1 overflow-y-auto rounded-field border border-base-300">
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
            {result.units.map((unit) => (
              <div
                key={unit.id}
                className="flex flex-col items-center gap-1.5 rounded-field border border-base-300 bg-base-100 p-2"
              >
                <QRCodeSVG value={unit.url} size={96} />
                <p className="w-full truncate text-center text-[10px] text-base-content/50">
                  {unit.code}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn min-h-11 rounded-field bg-primary text-primary-content hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
