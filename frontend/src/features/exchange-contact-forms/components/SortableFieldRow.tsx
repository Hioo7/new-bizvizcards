import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock, Pencil, SeparatorHorizontal, Trash2 } from "lucide-react";
import {
  CORE_TAG_ICON,
  FIELD_TYPE_ICON,
  FIELD_TYPE_LABEL,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import type { BuilderField } from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";

interface SortableFieldRowProps {
  field: BuilderField;
  onEdit: () => void;
  onRemove: () => void;
}

export default function SortableFieldRow({
  field,
  onEdit,
  onRemove,
}: SortableFieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key });
  const { draft } = field;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // A structural marker, not a question — no label/required state to show,
  // and nothing to edit, so it gets a distinct, compact divider row instead
  // of the standard question-row layout below.
  if (draft.type === "BREAK") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 border-b border-base-300 bg-base-200/50 px-3 py-2 last:border-b-0"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center text-base-content/30 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center gap-2 text-base-content/60">
          <SeparatorHorizontal className="h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold uppercase tracking-wide">Break</p>
          <div className="h-px flex-1 bg-base-300" />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove break"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error/70 hover:bg-error/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const isNameField = draft.tag === "LEAD_NAME";
  const Icon = (draft.tag && CORE_TAG_ICON[draft.tag]) || FIELD_TYPE_ICON[draft.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-b border-base-300 bg-base-100 px-3 py-3 last:border-b-0"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center text-base-content/30 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-base-content">
          {draft.label || "Untitled question"}
        </p>
        <p className="truncate text-xs text-base-content/50">
          {FIELD_TYPE_LABEL[draft.type]}
          {draft.isRequired ? " • Required" : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${draft.label || "field"}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
      >
        <Pencil className="h-4 w-4" />
      </button>
      {isNameField ? (
        <span
          title="The Name field can't be removed"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-base-content/25"
        >
          <Lock className="h-4 w-4" />
        </span>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${draft.label || "field"}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error/70 hover:bg-error/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
