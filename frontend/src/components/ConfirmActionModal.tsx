import { useEffect, useRef } from "react";
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

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
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
    </dialog>
  );
}
