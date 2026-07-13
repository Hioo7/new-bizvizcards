import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { deleteEcard } from "@services/ecardService";
import { ROUTES } from "@config/routes";
import HeroCard from "@features/ecards/components/HeroCard";
import SortableComponentRow from "@features/ecards/components/SortableComponentRow";
import ComponentTypePickerModal from "@features/ecards/components/ComponentTypePickerModal";
import HeroEditSheet from "@features/ecards/components/HeroEditSheet";
import AboutEditSheet from "@features/ecards/components/AboutEditSheet";
import SocialLinksEditSheet from "@features/ecards/components/SocialLinksEditSheet";
import VideoEditSheet from "@features/ecards/components/VideoEditSheet";
import GalleryEditSheet from "@features/ecards/components/GalleryEditSheet";
import TeamEditSheet from "@features/ecards/components/TeamEditSheet";
import { useEcardBuilder } from "@features/ecards/hooks/useEcardBuilder";
import { emptyDraftForType } from "@features/ecards/types/ecardBuilder.types";
import type { EcardComponentType } from "@app-types/ecard";

type EditingTarget = { kind: "hero" } | { kind: "component"; key: string } | null;

export default function EcardBuilderView() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { customerName?: string } };
  const customerName = location.state?.customerName;

  const builder = useEcardBuilder(customerId ?? "");
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [isPickingType, setIsPickingType] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteAction = useAsyncAction();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!customerId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing customer.</p>
      </div>
    );
  }

  const editingComponent =
    editing?.kind === "component"
      ? builder.state.components.find((c) => c.key === editing.key)
      : undefined;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    builder.setState((state) => {
      const oldIndex = state.components.findIndex((c) => c.key === active.id);
      const newIndex = state.components.findIndex((c) => c.key === over.id);
      if (oldIndex === -1 || newIndex === -1) return state;
      return { ...state, components: arrayMove(state.components, oldIndex, newIndex) };
    });
  }

  function handlePickType(type: EcardComponentType) {
    const key = crypto.randomUUID();
    builder.setState((state) => ({
      ...state,
      components: [...state.components, { key, draft: emptyDraftForType(type) }],
    }));
    setIsPickingType(false);
    setEditing({ kind: "component", key });
  }

  function handleRemoveComponent(key: string) {
    builder.setState((state) => ({
      ...state,
      components: state.components.filter((c) => c.key !== key),
    }));
  }

  async function handleSaveAll() {
    const saved = await builder.save();
    if (saved) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 3000);
    }
  }

  function handleDelete() {
    if (!builder.existingCard) return;
    void deleteAction.run(
      () => deleteEcard(builder.existingCard!.id),
      () => {
        setIsConfirmingDelete(false);
        navigate(ROUTES.adminEcards);
      },
    );
  }

  const addedTypes = builder.state.components.map((c) => c.draft.type);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminEcards)}
          aria-label="Back to e-cards"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            {customerName ?? "Customer"}&rsquo;s E-card
          </h1>
          <p className="text-sm text-base-content/60">
            {builder.existingCard ? "Editing existing card" : "Creating a new card"}
          </p>
        </div>
        {builder.existingCard && (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            aria-label="Delete e-card"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {builder.isLoading && (
        <p className="text-sm text-base-content/50">Loading…</p>
      )}
      {builder.loadError && <p className="text-sm text-error">{builder.loadError}</p>}

      {!builder.isLoading && (
        <>
          <HeroCard draft={builder.state.hero} onEdit={() => setEditing({ kind: "hero" })} />

          {builder.state.components.length === 0 && (
            <EmptyStepState
              icon={Plus}
              message="No components yet. Add About, Social Links, Gallery, Video, or Team."
            />
          )}

          {builder.state.components.length > 0 && (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={builder.state.components.map((c) => c.key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
                  {builder.state.components.map((component) => (
                    <SortableComponentRow
                      key={component.key}
                      component={component}
                      onEdit={() => setEditing({ kind: "component", key: component.key })}
                      onRemove={() => handleRemoveComponent(component.key)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <button
            type="button"
            onClick={() => setIsPickingType(true)}
            disabled={addedTypes.length >= 5}
            className="btn min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add component
          </button>

          {builder.saveError && <p className="text-sm text-error">{builder.saveError}</p>}

          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={builder.isSaving}
            className="btn min-h-11 gap-2 self-end rounded-field bg-primary px-6 text-primary-content hover:bg-primary/90"
          >
            {builder.isSaving && <span className="loading loading-spinner loading-sm" />}
            {savedAt && !builder.isSaving && <Check className="h-4 w-4" />}
            {savedAt && !builder.isSaving ? "Saved" : "Save card"}
          </button>
        </>
      )}

      <HeroEditSheet
        open={editing?.kind === "hero"}
        draft={builder.state.hero}
        isSubmitting={false}
        error={null}
        onClose={() => setEditing(null)}
        onSave={(hero) => {
          builder.setState((state) => ({ ...state, hero }));
          setEditing(null);
        }}
      />

      {editingComponent?.draft.type === "ABOUT" && (
        <AboutEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "SOCIAL_LINKS" && (
        <SocialLinksEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "VIDEO" && (
        <VideoEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "GALLERY" && (
        <GalleryEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "TEAM" && (
        <TeamEditSheet
          open
          customerId={customerId}
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      <ComponentTypePickerModal
        open={isPickingType}
        addedTypes={addedTypes}
        onClose={() => setIsPickingType(false)}
        onPick={handlePickType}
      />

      <ConfirmActionModal
        open={isConfirmingDelete}
        icon={Trash2}
        title="Delete this e-card?"
        description="This permanently removes the e-card and its media. This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
