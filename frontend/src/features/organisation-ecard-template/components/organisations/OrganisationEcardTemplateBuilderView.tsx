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
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import type { EcardComponentType } from "@app-types/ecard";
import {
  AboutEditSheet,
  BrochureEditSheet,
  ComponentTypePickerModal,
  ECARD_MAX_COMPONENTS,
  GalleryEditSheet,
  SocialLinksEditSheet,
  SortableComponentRow,
  TeamEditSheet,
  VideoEditSheet,
  WhatsAppEditSheet,
  emptyDraftForType,
  type OrganisationMembersScope,
} from "@features/ecards";
import { useOrganisationEcardTemplateBuilder } from "@features/organisation-ecard-template/hooks/useOrganisationEcardTemplateBuilder";
import OrganisationEcardTemplateHeroCard from "@features/organisation-ecard-template/components/organisations/OrganisationEcardTemplateHeroCard";
import OrganisationEcardTemplateHeroEditSheet from "@features/organisation-ecard-template/components/organisations/OrganisationEcardTemplateHeroEditSheet";
import RemoveOrganisationEcardTemplateModal from "@features/organisation-ecard-template/components/organisations/RemoveOrganisationEcardTemplateModal";
import {
  organisationEcardTemplateVideoSheetSchema,
  organisationEcardTemplateWhatsappSheetSchema,
} from "@features/organisation-ecard-template/schemas/organisationEcardTemplateComponentSchemas";
import { EMPTY_ORGANISATION_ECARD_TEMPLATE_POLICY_SELECTION } from "@features/organisation-ecard-template/utils/deriveOrganisationEcardTemplatePolicySelection";
import type {
  OrganisationEcardTemplateBuilderApi,
  OrganisationEcardTemplatePolicySelection,
} from "@features/organisation-ecard-template/types/organisationEcardTemplateBuilder.types";

type EditingTarget = { kind: "hero" } | { kind: "component"; key: string } | null;

export interface OrganisationEcardTemplateBuilderViewProps {
  organisationId: string;
  organisationName: string;
  api: OrganisationEcardTemplateBuilderApi;
  /** Resolves which layouts/themes/icon shapes/components the organisation's
   * plan allows. Must be a stable (e.g. useCallback'd) reference. */
  loadPolicy: () => Promise<OrganisationEcardTemplatePolicySelection>;
  /** Omit to hide the back button (e.g. when embedded as a dashboard tab). */
  onBack?: () => void;
  /** Which auth scope the Team component's member picker should call. */
  teamPickerScope: OrganisationMembersScope;
}

export default function OrganisationEcardTemplateBuilderView({
  organisationId,
  organisationName,
  api,
  loadPolicy,
  onBack,
  teamPickerScope,
}: OrganisationEcardTemplateBuilderViewProps) {
  const [policySelection, setPolicySelection] =
    useState<OrganisationEcardTemplatePolicySelection>(
      EMPTY_ORGANISATION_ECARD_TEMPLATE_POLICY_SELECTION,
    );

  useEffect(() => {
    let cancelled = false;
    void loadPolicy().then((selection) => {
      if (!cancelled) setPolicySelection(selection);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPolicy]);

  const builder = useOrganisationEcardTemplateBuilder(organisationId, api);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [isPickingType, setIsPickingType] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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
      return {
        ...state,
        components: arrayMove(state.components, oldIndex, newIndex),
      };
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
    if (!saved) return;
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  }

  async function handleConfirmRemove() {
    const removed = await builder.remove();
    if (removed) {
      setIsConfirmingRemove(false);
    }
  }

  const addedTypes = builder.state.components.map((c) => c.draft.type);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to organisation"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            {organisationName}&rsquo;s E-card Policy
          </h1>
          <p className="text-sm text-base-content/60">
            Applied to every e-card linked to this organisation
          </p>
        </div>
        {builder.templateExists && (
          <button
            type="button"
            onClick={() => setIsConfirmingRemove(true)}
            aria-label="Remove e-card policy"
            title="Remove e-card policy"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-error/70 hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {builder.isLoading && (
        <p className="text-sm text-base-content/50">Loading…</p>
      )}
      {builder.loadError && (
        <p className="text-sm text-error">{builder.loadError}</p>
      )}

      {!builder.isLoading && (
        <>
          <OrganisationEcardTemplateHeroCard
            draft={builder.state.hero}
            onEdit={() => setEditing({ kind: "hero" })}
          />

          {builder.state.components.length === 0 && (
            <EmptyStepState
              icon={Plus}
              message="No components yet. Add About, Social Links, Gallery, Video, Team, WhatsApp, or Brochure."
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
                      onEdit={() =>
                        setEditing({ kind: "component", key: component.key })
                      }
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
            className="btn min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200 disabled:opacity-50"
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
            className="btn min-h-11 gap-2 rounded-field bg-primary px-6 text-primary-content hover:bg-primary/90"
          >
            {builder.isSaving && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {savedAt && !builder.isSaving && <Check className="h-4 w-4" />}
            {savedAt && !builder.isSaving ? "Saved" : "Save policy"}
          </button>
        </>
      )}

      {editing?.kind === "hero" && (
        <OrganisationEcardTemplateHeroEditSheet
          open
          draft={builder.state.hero}
          isSubmitting={false}
          error={null}
          availableHeroLayouts={policySelection.availableHeroLayouts}
          availableThemes={policySelection.availableThemes}
          availableIconShapes={policySelection.availableIconShapes}
          accentColorCustomizationAvailable={
            policySelection.accentColorCustomizationAvailable
          }
          accentColorPresets={policySelection.accentColorPresets}
          onClose={() => setEditing(null)}
          onSave={(hero) => {
            builder.setState((state) => ({ ...state, hero }));
            setEditing(null);
          }}
        />
      )}

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
          schema={organisationEcardTemplateVideoSheetSchema}
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
          organisationId={organisationId}
          scope={teamPickerScope}
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

      {editingComponent?.draft.type === "WHATSAPP" && (
        <WhatsAppEditSheet
          open
          draft={editingComponent.draft}
          heroPhone={builder.state.hero}
          schema={organisationEcardTemplateWhatsappSheetSchema}
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

      {editingComponent?.draft.type === "BROCHURE" && (
        <BrochureEditSheet
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

      <ComponentTypePickerModal
        open={isPickingType}
        addedTypes={addedTypes}
        isTeamDisabled={false}
        planUnavailableTypes={policySelection.planUnavailableTypes}
        onClose={() => setIsPickingType(false)}
        onPick={handlePickType}
      />

      <RemoveOrganisationEcardTemplateModal
        open={isConfirmingRemove}
        isSubmitting={builder.isDeleting}
        error={builder.deleteError}
        onCancel={() => setIsConfirmingRemove(false)}
        onConfirm={() => void handleConfirmRemove()}
      />
    </div>
  );
}
