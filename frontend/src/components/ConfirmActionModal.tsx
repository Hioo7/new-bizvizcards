import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

interface ConfirmActionModalProps {
  open: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionModal({
  open,
  icon: Icon,
  title,
  description,
  confirmLabel,
  isDestructive = false,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The native "close" event is wired via addEventListener, not the JSX
  // onClose prop: React's synthetic handling of <dialog> onClose bubbles
  // through the *React* tree, and when this dialog is portaled while nested
  // (in React terms) inside another open <dialog>, that cross-bubbling fires
  // the ANCESTOR dialog's onClose too — closing a sheet this is opened from
  // on top of. addEventListener only ever fires for events dispatched on
  // this exact DOM node, which is what "close" actually is (a native,
  // non-bubbling event).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", onCancel);
    return () => dialog.removeEventListener("close", onCancel);
  }, [onCancel]);

  // Portaled to <body> — this can be opened while another dialog (e.g. an
  // edit sheet) is already showModal()'d above it. Two native <dialog>
  // elements where one is a DOM descendant of the other is unreliable
  // across browsers (closing the inner one can take the outer one with it);
  // rendering both as top-level siblings avoids that entirely. showModal()
  // already visually escapes normal layout via the browser's top layer, so
  // this changes nothing about where it appears on screen.
  return createPortal(
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              isDestructive ? "bg-error/10" : "bg-warning/10"
            }`}
          >
            <Icon className={`h-5 w-5 ${isDestructive ? "text-error" : "text-warning"}`} />
          </div>
          <h3 className="text-lg font-bold text-base-content">{title}</h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">{description}</p>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <div className="modal-action">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`btn min-h-11 gap-2 rounded-field text-white ${
              isDestructive ? "bg-error hover:bg-error/90" : "bg-warning hover:bg-warning/90"
            }`}
          >
            {isSubmitting && <span className="loading loading-spinner loading-sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>,
    document.body,
  );
}
