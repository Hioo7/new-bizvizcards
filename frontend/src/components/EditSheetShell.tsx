import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";

interface EditSheetShellProps {
  open: boolean;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Omit for a "browse/manage" sheet whose actions already save themselves — shows a single Done button instead of Cancel/Save. */
  onSave?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  children: ReactNode;
}

export default function EditSheetShell({
  open,
  icon: Icon,
  title,
  subtitle,
  onClose,
  onSave,
  isSubmitting = false,
  error = null,
  children,
}: EditSheetShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The native "close" event is wired via addEventListener, not the JSX
  // onClose prop: React's synthetic handling of <dialog> onClose bubbles
  // through the *React* tree, and this sheet's own children can open a
  // second <dialog> (e.g. a confirm modal) that's nested here in React
  // terms — if that dialog closes via JSX onClose, the cross-bubbling fires
  // THIS dialog's onClose too, closing the whole sheet along with it.
  // addEventListener only ever fires for events dispatched on this exact
  // DOM node, which is what "close" actually is (a native, non-bubbling
  // event).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  // Portaled to <body> — this sheet's own children (e.g. a confirm dialog)
  // can open a second native <dialog> while this one is still showModal()'d.
  // Nesting one <dialog> inside another as a DOM descendant is unreliable
  // across browsers, so every dialog here renders as a top-level sibling
  // instead; showModal() already visually escapes normal layout via the
  // browser's top layer, so this changes nothing about where it appears.
  return createPortal(
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg">
        <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-base-content">{title}</h3>
            {subtitle && (
              <p className="truncate text-xs text-base-content/50">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-4">{children}</div>
        </div>

        <div className="shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
          <FormErrorRibbon message={error} />
          <div className="mt-3 flex justify-end gap-2">
            {onSave ? (
              <>
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
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn min-h-11 rounded-field bg-primary text-primary-content hover:bg-primary/90"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>,
    document.body,
  );
}
