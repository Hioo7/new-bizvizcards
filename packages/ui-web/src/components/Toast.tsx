import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastProps {
  tone?: ToastTone;
  /** Status icon — toasts always pair an icon with the label. */
  icon?: ReactNode;
  children: ReactNode;
  /** Renders a trailing dismiss button when provided. */
  onDismiss?: () => void;
}

const TONE_CLASS: Record<ToastTone, string> = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-error",
};

/**
 * A single transient status message. Position it with a `toast toast-top
 * toast-center` wrapper at the app root and animate it in/out there.
 */
export function Toast({ tone = "info", icon, children, onDismiss }: ToastProps) {
  return (
    <div role="status" className={cn("alert", TONE_CLASS[tone], "shadow-lg")}>
      {icon ? (
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      ) : null}
      <span className="text-sm">{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="btn btn-ghost btn-xs btn-circle"
        >
          <span aria-hidden="true">✕</span>
        </button>
      ) : null}
    </div>
  );
}
