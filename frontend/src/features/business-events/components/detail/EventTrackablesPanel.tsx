import { useState } from "react";
import { Gift, Plus, Trash2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ConfirmActionModal from "@components/ConfirmActionModal";
import type { EventTrackableListItem } from "@app-types/businessEvent";
import EventTrackableRow from "@features/business-events/components/detail/EventTrackableRow";
import EventTrackableFormModal from "@features/business-events/components/detail/EventTrackableFormModal";

interface TrackableFormValues {
  name: string;
  description?: string;
  dependsOnTrackableIds: string[];
}

interface EventTrackablesPanelProps {
  eventId: string;
  trackables: EventTrackableListItem[];
  onCreateTrackable: (
    eventId: string,
    values: TrackableFormValues,
  ) => Promise<void>;
  onUpdateTrackable: (
    eventId: string,
    trackableId: string,
    values: TrackableFormValues,
  ) => Promise<void>;
  onRemoveTrackable: (eventId: string, trackableId: string) => Promise<void>;
}

export default function EventTrackablesPanel({
  eventId,
  trackables,
  onCreateTrackable,
  onUpdateTrackable,
  onRemoveTrackable,
}: EventTrackablesPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrackable, setEditingTrackable] =
    useState<EventTrackableListItem | null>(null);
  const [removeTarget, setRemoveTarget] =
    useState<EventTrackableListItem | null>(null);
  const createAction = useAsyncAction();
  const editAction = useAsyncAction();
  const removeAction = useAsyncAction();

  function handleCreateSubmit(values: TrackableFormValues) {
    void createAction.run(
      () => onCreateTrackable(eventId, values),
      () => setIsCreateOpen(false),
    );
  }

  function handleEditSubmit(values: TrackableFormValues) {
    if (!editingTrackable) return;
    void editAction.run(
      () => onUpdateTrackable(eventId, editingTrackable.id, values),
      () => setEditingTrackable(null),
    );
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    void removeAction.run(
      () => onRemoveTrackable(eventId, removeTarget.id),
      () => setRemoveTarget(null),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-content/70">
          Trackables ({trackables.length})
        </h2>
        <button
          type="button"
          onClick={() => {
            createAction.reset();
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-field border border-base-300 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <Plus className="h-4 w-4" />
          Add trackable
        </button>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        {trackables.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Gift className="h-8 w-8 text-base-content/30" />
            <p className="text-sm text-base-content/60">
              No trackables yet.
            </p>
          </div>
        ) : (
          trackables.map((trackable) => (
            <EventTrackableRow
              key={trackable.id}
              trackable={trackable}
              onEdit={() => {
                editAction.reset();
                setEditingTrackable(trackable);
              }}
              onRemove={() => {
                removeAction.reset();
                setRemoveTarget(trackable);
              }}
            />
          ))
        )}
      </div>

      <EventTrackableFormModal
        mode="create"
        siblingTrackables={trackables}
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EventTrackableFormModal
        mode="edit"
        trackable={editingTrackable ?? undefined}
        siblingTrackables={trackables.filter(
          (t) => t.id !== editingTrackable?.id,
        )}
        open={editingTrackable !== null}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setEditingTrackable(null)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmActionModal
        open={removeTarget !== null}
        icon={Trash2}
        title={`Delete "${removeTarget?.name}"?`}
        description="This removes the trackable and its redemption history. This cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={removeAction.isSubmitting}
        error={removeAction.error}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
