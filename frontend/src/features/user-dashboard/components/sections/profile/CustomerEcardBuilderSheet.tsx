import { useEffect, useState } from "react";
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
import { Check, Plus } from "lucide-react";
import type { Ecard } from "@app-types/ecard";
import {
  HeroCard,
  EcardSettingsCard,
  SortableComponentRow,
  ComponentTypePickerModal,
  AboutEditSheet,
  SocialLinksEditSheet,
  VideoEditSheet,
  GalleryEditSheet,
  VideoGalleryEditSheet,
  TeamEditSheet,
  WhatsAppEditSheet,
  BrochureEditSheet,
  ECARD_COMPONENT_TYPES,
  ECARD_MAX_COMPONENTS,
  emptyDraftForType,
  type EcardBuilderState,
} from "@features/ecards";
import type { EcardComponentType } from "@app-types/ecard";
import { useCustomerEcardBuilder } from "@features/user-dashboard/hooks/useCustomerEcardBuilder";
import { useMyEffectivePolicy } from "@hooks/useMyEffectivePolicy";
import { getMyOrganisationEcardTemplate } from "@services/organisationEcardTemplateService";
import CustomerHeroEditSheet from "./CustomerHeroEditSheet";

type EditingTarget = { kind: "hero" } | { kind: "component"; key: string } | null;

interface CustomerEcardBuilderSheetProps {
  open: boolean;
  existingEcard: Ecard | null;
  prefillName: string;
  prefillEmail: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerEcardBuilderSheet({
  open,
  existingEcard,
  prefillName,
  prefillEmail,
  onClose,
  onSaved,
}: CustomerEcardBuilderSheetProps) {
  const builder = useCustomerEcardBuilder(prefillName, prefillEmail, existingEcard);
  const { policy } = useMyEffectivePolicy();
  const planUnavailableTypes = policy
    ? ECARD_COMPONENT_TYPES.filter((type) => !policy.ecard.components[type])
    : [];
  const availableHeroLayouts = policy?.ecard.heroLayouts ?? null;
  const availableThemes = policy?.ecard.themes ?? null;
  const availableIconShapes = policy?.ecard.iconShapes ?? null;
  const accentColorCustomizationAvailable =
    policy?.ecard.accentColorCustomizationAvailable ?? false;
  const accentColorPresets = policy?.ecard.accentColorPresets ?? [];
  const organisationId = builder.state.hero.organisationId;
  const [organisationAccentColorLock, setOrganisationAccentColorLock] =
    useState<{
      primaryAccentColor: string | null;
      secondaryAccentColor: string | null;
    } | null>(null);
  const [editing, setEditing] = useState<EditingTarget>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganisationAccentColorLock() {
      if (!organisationId) {
        if (!cancelled) setOrganisationAccentColorLock(null);
        return;
      }
      try {
        const template = await getMyOrganisationEcardTemplate(organisationId);
        if (cancelled) return;
        setOrganisationAccentColorLock(
          template
            ? {
                primaryAccentColor: template.hero.primaryAccentColor,
                secondaryAccentColor: template.hero.secondaryAccentColor,
              }
            : null,
        );
      } catch {
        if (!cancelled) setOrganisationAccentColorLock(null);
      }
    }

    void loadOrganisationAccentColorLock();
    return () => {
      cancelled = true;
    };
  }, [organisationId]);
  // Reset editing state when we load a new card (e.g. switching from one ecard to another)
  // Handled by the `key` prop on this component — state already resets on key change.
  const [isPickingType, setIsPickingType] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (!open) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    builder.setState((state: EcardBuilderState) => {
      const oldIndex = state.components.findIndex((c) => c.key === active.id);
      const newIndex = state.components.findIndex((c) => c.key === over.id);
      if (oldIndex === -1 || newIndex === -1) return state;
      return { ...state, components: arrayMove(state.components, oldIndex, newIndex) };
    });
  }

  function handlePickType(type: EcardComponentType) {
    const key = crypto.randomUUID();
    builder.setState((state: EcardBuilderState) => ({
      ...state,
      components: [...state.components, { key, draft: emptyDraftForType(type) }],
    }));
    setIsPickingType(false);
    setEditing({ kind: "component", key });
  }

  function handleRemoveComponent(key: string) {
    builder.setState((state: EcardBuilderState) => ({
      ...state,
      components: state.components.filter((c) => c.key !== key),
    }));
  }

  async function handleSaveAll() {
    const saved = await builder.save();
    if (!saved) return;
    onSaved();
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  }

  const addedTypes = builder.state.components.map((c) => c.draft.type);

  const editingComponent =
    editing?.kind === "component"
      ? builder.state.components.find((c) => c.key === editing.key)
      : undefined;

  const isNew = builder.savedCard === null;

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box p-0 overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[92dvh] sm:max-w-2xl rounded-t-3xl rounded-b-none sm:rounded-2xl">
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-base-300" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 pt-4 pb-4 border-b border-base-200">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-base-content/60"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-base-content truncate">
              {isNew ? "New E-Card" : `Edit — ${existingEcard?.hero.name ?? "E-Card"}`}
            </p>
            <p className="text-xs text-base-content/50">
              {isNew ? "Create a new card" : "Editing existing card"}
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 flex flex-col gap-5 pb-28">
          {builder.isLoading && (
            <div className="flex flex-col gap-4">
              <div className="skeleton h-20 w-full rounded-2xl" />
              <div className="skeleton h-32 w-full rounded-2xl" />
              <div className="skeleton h-12 w-full rounded-2xl" />
            </div>
          )}

          {!builder.isLoading && builder.loadError && (
            <div className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
              {builder.loadError}
            </div>
          )}

          {!builder.isLoading && !builder.loadError && (
            <>
          <HeroCard
            draft={builder.state.hero}
            onEdit={() => setEditing({ kind: "hero" })}
            hasError={!!builder.heroFieldErrors}
          />

          <EcardSettingsCard
            draft={builder.state.hero}
            onChange={(hero) =>
              builder.setState((state: EcardBuilderState) => ({ ...state, hero }))
            }
          />

          {builder.state.components.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border border-dashed border-base-300">
              <p className="text-sm text-base-content/50">
                No components yet. Add About, Social Links, Gallery, Video, WhatsApp, or Brochure.
              </p>
            </div>
          )}

          {builder.state.components.length > 0 && (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={builder.state.components.map((c) => c.key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100">
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
            disabled={addedTypes.length >= ECARD_MAX_COMPONENTS}
            className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add component
          </button>

          {builder.saveError && (
            <p className="text-sm text-error">{builder.saveError}</p>
          )}

          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={builder.isSaving}
            className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-content hover:opacity-90 disabled:opacity-60"
          >
            {builder.isSaving && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {savedAt && !builder.isSaving && <Check className="h-4 w-4" />}
            {savedAt && !builder.isSaving ? "Saved" : "Save card"}
          </button>
            </>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />

      {/* Hero edit sheet */}
      {editing?.kind === "hero" && (
        <CustomerHeroEditSheet
          open
          draft={builder.state.hero}
          isSubmitting={false}
          error={builder.saveError}
          fieldErrors={builder.heroFieldErrors}
          availableHeroLayouts={availableHeroLayouts}
          availableThemes={availableThemes}
          availableIconShapes={availableIconShapes}
          accentColorCustomizationAvailable={accentColorCustomizationAvailable}
          accentColorPresets={accentColorPresets}
          organisationAccentColorLock={organisationAccentColorLock}
          onClose={() => setEditing(null)}
          onSave={(hero) => {
            builder.setState((state: EcardBuilderState) => ({ ...state, hero }));
            setEditing(null);
          }}
        />
      )}

      {/* Component edit sheets */}
      {editingComponent?.draft.type === "ABOUT" && (
        <AboutEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state: EcardBuilderState) => ({
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
            builder.setState((state: EcardBuilderState) => ({
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
            builder.setState((state: EcardBuilderState) => ({
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
            builder.setState((state: EcardBuilderState) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "VIDEO_GALLERY" && (
        <VideoGalleryEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state: EcardBuilderState) => ({
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
          organisationId={builder.state.hero.organisationId}
          scope="customer"
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state: EcardBuilderState) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "WHATSAPP" && (
        <WhatsAppEditSheet
          open
          draft={editingComponent.draft}
          heroPhone={builder.state.hero}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state: EcardBuilderState) => ({
              ...state,
              components: state.components.map((c) =>
                c.key === editingComponent.key ? { ...c, draft } : c,
              ),
            }));
            setEditing(null);
          }}
        />
      )}

      {editingComponent?.draft.type === "BROCHURE" && (
        <BrochureEditSheet
          open
          draft={editingComponent.draft}
          isSubmitting={false}
          error={null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            builder.setState((state: EcardBuilderState) => ({
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
        isTeamDisabled={builder.state.hero.organisationId === null}
        planUnavailableTypes={planUnavailableTypes}
        onClose={() => setIsPickingType(false)}
        onPick={handlePickType}
      />
    </dialog>
  );
}
