import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Large muted icon above the title. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary recovery action (usually a `Button`). */
  action?: ReactNode;
}

/** The zero-data state for a list or section. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-box bg-base-200 text-base-content/40">
          {icon}
        </span>
      ) : null}
      <p className="text-base font-semibold text-base-content">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-base-content/60">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
