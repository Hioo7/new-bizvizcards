import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { InternalRedirect } from "@features/redirects/types/redirects.types";
import RedirectEnabledToggle from "@features/redirects/components/RedirectEnabledToggle";

interface InternalRedirectRowProps {
  redirect: InternalRedirect;
  canManage: boolean;
  onToggleEnabled: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function InternalRedirectRow({
  redirect,
  canManage,
  onToggleEnabled,
  onEdit,
  onDelete,
}: InternalRedirectRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="truncate font-semibold text-base-content">
          {redirect.sourcePath}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-base-content/40" />
        <span className="truncate text-base-content/70">
          {redirect.targetPath}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <RedirectEnabledToggle
          enabled={redirect.enabled}
          disabled={!canManage}
          onToggle={onToggleEnabled}
        />
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Edit redirect from ${redirect.sourcePath}`}
              onClick={onEdit}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Delete redirect from ${redirect.sourcePath}`}
              onClick={onDelete}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
