import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Icon shown beside the title (dialog titles always get one). */
  titleIcon?: ReactNode;
  /** Optional supporting line under the title. */
  description?: string;
  children: ReactNode;
  /** Action row pinned to the bottom (typically one or two `Button`s). */
  footer?: ReactNode;
}

/**
 * A bottom sheet on mobile that becomes a centered modal from `sm` up
 * (daisyUI `modal modal-bottom sm:modal-middle`). Controlled via `open`;
 * `onClose` fires on the ✕, the backdrop, and the Escape key.
 *
 * Keep the sheet's own size fixed — make inner lists scroll, don't let the
 * sheet grow to fit dynamic content.
 */
export function Sheet({
  open,
  onClose,
  title,
  titleIcon,
  description,
  children,
  footer,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        "modal modal-bottom sm:modal-middle",
        open && "modal-open",
      )}
    >
      <div className="modal-box flex max-h-[85vh] flex-col">
        <div className="flex items-start gap-2">
          {titleIcon ? (
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center text-primary">
              {titleIcon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-base-content">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-sm text-base-content/60">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm btn-circle -mr-1 -mt-1"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="-mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1">
          {children}
        </div>

        {footer ? <div className="modal-action mt-4">{footer}</div> : null}
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
    </div>
  );
}
