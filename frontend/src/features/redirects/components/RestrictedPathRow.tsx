import { Trash2 } from "lucide-react";
import type { RestrictedPath } from "@features/redirects/types/redirects.types";

interface RestrictedPathRowProps {
  restrictedPath: RestrictedPath;
  canManage: boolean;
  onDelete: () => void;
}

export default function RestrictedPathRow({
  restrictedPath,
  canManage,
  onDelete,
}: RestrictedPathRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-4">
      <span className="truncate text-sm font-semibold text-base-content">
        {restrictedPath.path}
      </span>
      {canManage && (
        <button
          type="button"
          aria-label={`Delete restricted path ${restrictedPath.path}`}
          onClick={onDelete}
          className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
