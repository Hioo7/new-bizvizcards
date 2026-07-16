import { useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import type { EventTrackableListItem } from "@app-types/businessEvent";
import {
  EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH,
  EVENT_TRACKABLE_NAME_MAX_LENGTH,
} from "@features/business-events/config";

interface EventTrackableFormModalProps {
  mode: "create" | "edit";
  trackable?: EventTrackableListItem;
  /** Every other trackable in this event — candidates for "depends on". */
  siblingTrackables: EventTrackableListItem[];
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    description?: string;
    dependsOnTrackableIds: string[];
  }) => void;
}

export default function EventTrackableFormModal({
  mode,
  trackable,
  siblingTrackables,
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: EventTrackableFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dependsOnTrackableIds, setDependsOnTrackableIds] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName(mode === "edit" && trackable ? trackable.name : "");
      setDescription(
        mode === "edit" && trackable ? (trackable.description ?? "") : "",
      );
      setDependsOnTrackableIds(
        mode === "edit" && trackable
          ? trackable.dependencies.map((dependency) => dependency.id)
          : [],
      );
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mode, trackable]);

  function toggleDependency(trackableId: string) {
    setDependsOnTrackableIds((current) =>
      current.includes(trackableId)
        ? current.filter((id) => id !== trackableId)
        : [...current, trackableId],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      dependsOnTrackableIds,
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            {mode === "create" ? "Create trackable" : "Edit trackable"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60">
              Name
            </span>
            <input
              type="text"
              maxLength={EVENT_TRACKABLE_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Food Coupon"
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60">
              Description (optional)
            </span>
            <textarea
              maxLength={EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="w-full rounded-field border border-base-300 bg-base-200 px-3 py-2.5 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </label>

          {siblingTrackables.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-base-content/60">
                Depends on (optional)
              </p>
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-field border border-base-300 bg-base-200 p-2">
                {siblingTrackables.map((sibling) => (
                  <label
                    key={sibling.id}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-field px-2 py-1.5 hover:bg-base-300/50"
                  >
                    <span className="text-sm text-base-content">
                      {sibling.name}
                    </span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={dependsOnTrackableIds.includes(sibling.id)}
                      onChange={() => toggleDependency(sibling.id)}
                      aria-label={`Depends on ${sibling.name}`}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-base-content/40">
                A guest must redeem all selected trackables first.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="modal-action">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Save
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
