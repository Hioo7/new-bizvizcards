import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import SortableFieldRow from "@features/exchange-contact-forms/components/SortableFieldRow";
import FieldTypePickerModal from "@features/exchange-contact-forms/components/FieldTypePickerModal";
import FieldEditSheetRouter from "@features/exchange-contact-forms/components/FieldEditSheetRouter";
import {
  CORE_FIELD_CATALOG,
  EXCHANGE_CONTACT_FORM_MAX_FIELDS,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import {
  emptyDraftForCoreTag,
  emptyDraftForCustomQuestionType,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";
import type {
  BuilderField,
  FieldDraft,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";

interface FieldListEditorProps {
  fields: BuilderField[];
  onChange: (fields: BuilderField[]) => void;
}

export default function FieldListEditor({
  fields,
  onChange,
}: FieldListEditorProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isPickingType, setIsPickingType] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const editingField = fields.find((f) => f.key === editingKey);
  const addedTags = fields.map((f) => f.draft.tag);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.key === active.id);
    const newIndex = fields.findIndex((f) => f.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(fields, oldIndex, newIndex));
  }

  function addField(draft: FieldDraft) {
    const key = crypto.randomUUID();
    onChange([...fields, { key, draft }]);
    setIsPickingType(false);
    // A Break has no edit sheet (nothing to edit) — see
    // FieldEditSheetRouter, which returns null for it.
    if (draft.type !== "BREAK") setEditingKey(key);
  }

  function handlePickCore(entry: (typeof CORE_FIELD_CATALOG)[number]) {
    // LEAD_NAME's catalog entry exists purely for display (it's always
    // pre-added and its picker button is always disabled) — never reachable
    // here, but guarded explicitly rather than asserted away.
    if (entry.tag === "LEAD_NAME") return;
    addField(emptyDraftForCoreTag(entry.tag, entry.type, entry.label));
  }

  function handlePickCustom(
    type: "SHORT_TEXT" | "MULTIPLE_CHOICE" | "DROPDOWN" | "DATE" | "BREAK",
  ) {
    addField(emptyDraftForCustomQuestionType(type));
  }

  function handleRemove(key: string) {
    onChange(fields.filter((f) => f.key !== key));
  }

  function handleSaveField(draft: FieldDraft) {
    onChange(fields.map((f) => (f.key === editingKey ? { ...f, draft } : f)));
    setEditingKey(null);
  }

  return (
    <>
      {fields.length === 0 && (
        <EmptyStepState
          icon={Plus}
          message="No fields yet. Add core fields (Phone, Email, Note…) or custom questions."
        />
      )}

      {fields.length > 0 && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={fields.map((f) => f.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
              {fields.map((field) => (
                <SortableFieldRow
                  key={field.key}
                  field={field}
                  onEdit={() => setEditingKey(field.key)}
                  onRemove={() => handleRemove(field.key)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={() => setIsPickingType(true)}
        disabled={fields.length >= EXCHANGE_CONTACT_FORM_MAX_FIELDS}
        className="btn min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add field
      </button>

      <FieldEditSheetRouter
        editingField={editingField}
        onClose={() => setEditingKey(null)}
        onSave={handleSaveField}
      />

      <FieldTypePickerModal
        open={isPickingType}
        addedTags={addedTags}
        onClose={() => setIsPickingType(false)}
        onPickCore={handlePickCore}
        onPickCustom={handlePickCustom}
      />
    </>
  );
}
