import { MessageSquareText, SquarePen, Trash2 } from "lucide-react";
import type { BulkMessageTemplateSummary } from "@app-types/bulkMessenger";

interface TemplateRowProps {
  template: BulkMessageTemplateSummary;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TemplateRow({
  template,
  onEdit,
  onDelete,
}: TemplateRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MessageSquareText className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-base-content">
            {template.name}
          </span>
          <span className="block truncate text-xs text-base-content/50">
            {template.linkedFormName ?? "No linked form"} •{" "}
            {template.sendCount} {template.sendCount === 1 ? "send" : "sends"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit template"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-base-200"
      >
        <SquarePen className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete template"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
