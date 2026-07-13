import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";

interface ComponentEditSheetShellProps {
  open: boolean;
  icon: LucideIcon;
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  children: ReactNode;
}

export default function ComponentEditSheetShell({
  open,
  icon: Icon,
  title,
  onClose,
  onSave,
  isSubmitting = false,
  error = null,
  children,
}: ComponentEditSheetShellProps) {
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
      onClose={onClose}
    >
      <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg">
        <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">{title}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-4">{children}</div>
        </div>

        <div className="shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
          <FormErrorRibbon message={error} />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
            >
              {isSubmitting && <span className="loading loading-spinner loading-sm" />}
              Save
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
