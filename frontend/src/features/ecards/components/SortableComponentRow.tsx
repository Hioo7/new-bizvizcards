import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { ECARD_COMPONENT_META } from "@features/ecards/config/ecardBuilder.config";
import type { BuilderComponent } from "@features/ecards/types/ecardBuilder.types";

interface SortableComponentRowProps {
  component: BuilderComponent;
  onEdit: () => void;
  onRemove: () => void;
}

export default function SortableComponentRow({
  component,
  onEdit,
  onRemove,
}: SortableComponentRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: component.key });
  const meta = ECARD_COMPONENT_META[component.draft.type];
  const Icon = meta.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
      <p className="flex-1 truncate text-sm font-medium text-base-content">
        {meta.label}
      </p>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${meta.label}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${meta.label}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error/70 hover:bg-error/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
