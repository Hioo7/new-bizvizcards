import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  PROFILE_CARD_IDS,
  PROFILE_CARD_LABELS,
} from "@features/user-dashboard/config";

type CardId = (typeof PROFILE_CARD_IDS)[number];

interface ReorderSheetProps {
  open: boolean;
  cardOrder: CardId[];
  onSave: (newOrder: CardId[]) => void;
  onClose: () => void;
  /** Called when user taps a row to view/edit — receives the id and the current draft order */
  onSelect: (id: CardId, currentDraftOrder: CardId[]) => void;
}

function SortableRow({
  id,
  onSelect,
}: {
  id: CardId;
  onSelect: (id: CardId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden"
    >
      {/* Drag handle — only this area initiates drag */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder"
        className="flex h-14 w-12 shrink-0 cursor-grab items-center justify-center text-base-content/30 hover:text-base-content/60 active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Tappable row body — opens the card for viewing/editing */}
      <button
        type="button"
        onClick={() => onSelect(id)}
        className="flex flex-1 items-center gap-2 py-4 pr-4 text-left min-h-[56px]"
      >
        <span className="flex-1 text-sm font-medium text-base-content">
          {PROFILE_CARD_LABELS[id]}
        </span>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-base-content/30" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default function ReorderSheet({
  open,
  cardOrder,
  onSave,
  onClose,
  onSelect,
}: ReorderSheetProps) {
  const [draftOrder, setDraftOrder] = useState<CardId[]>(cardOrder);

  // Keep draft in sync when sheet opens with a new order
  if (open && draftOrder.length !== cardOrder.length) {
    setDraftOrder(cardOrder);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draftOrder.indexOf(active.id as CardId);
    const newIndex = draftOrder.indexOf(over.id as CardId);
    setDraftOrder(arrayMove(draftOrder, oldIndex, newIndex));
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-bottom" open>
      <div className="modal-box p-0 overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-base-300 px-5 py-4 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-base-content">Reorder Cards</h3>
            <p className="text-xs text-base-content/50">Drag to reorder · Tap to view &amp; edit</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-base-200 text-base-content/50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Draggable list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={draftOrder} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {draftOrder.map((id) => (
                  <SortableRow
                    key={id}
                    id={id}
                    onSelect={(selectedId) => onSelect(selectedId, draftOrder)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-base-300 px-4 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-base-300 py-3 text-sm font-semibold text-base-content hover:bg-base-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draftOrder)}
            className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-content transition-opacity hover:opacity-90"
          >
            Save Order
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
