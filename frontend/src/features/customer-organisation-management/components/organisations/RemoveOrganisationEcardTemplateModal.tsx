import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

interface RemoveOrganisationEcardTemplateModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RemoveOrganisationEcardTemplateModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: RemoveOrganisationEcardTemplateModalProps) {
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error/10">
            <Trash2 className="h-5 w-5 text-error" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            Remove this e-card policy?
          </h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">
          Every linked member&rsquo;s e-card will immediately go back to
          showing their own, unmodified content — this can&rsquo;t be undone.
        </p>
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
            className="btn min-h-11 gap-2 rounded-field bg-error text-error-content hover:bg-error/90"
          >
            {isSubmitting && (
              <span className="loading loading-spinner loading-sm" />
            )}
            Remove policy
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
