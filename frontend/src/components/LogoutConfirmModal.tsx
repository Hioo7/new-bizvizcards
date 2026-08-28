import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  open: boolean;
  isLoggingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  open,
  isLoggingOut,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral/10">
            <LogOut className="h-5 w-5 text-neutral" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Log out?</h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">
          You&apos;ll need to verify your email again to sign back in.
        </p>
        <div className="modal-action">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoggingOut}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="btn min-h-11 gap-2 rounded-field bg-neutral text-neutral-content hover:bg-neutral/90"
          >
            {isLoggingOut ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Log out
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
