import { useState } from "react";
import { Plus, ShieldOff, Trash2 } from "lucide-react";
import { useRestrictedPaths } from "@features/redirects/hooks/useRestrictedPaths";
import { useRestrictedPathMutations } from "@features/redirects/hooks/useRestrictedPathMutations";
import { useAsyncAction } from "@hooks/useAsyncAction";
import RestrictedPathRow from "@features/redirects/components/RestrictedPathRow";
import CreateRestrictedPathModal from "@features/redirects/components/CreateRestrictedPathModal";
import ConfirmActionModal from "@components/ConfirmActionModal";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import type { RestrictedPath } from "@features/redirects/types/redirects.types";
import type { RestrictedPathValues } from "@features/redirects/schemas/restrictedPathSchema";

interface RestrictedPathsPanelProps {
  canManage: boolean;
}

export default function RestrictedPathsPanel({
  canManage,
}: RestrictedPathsPanelProps) {
  const list = useRestrictedPaths();
  const mutations = useRestrictedPathMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingPath, setDeletingPath] = useState<RestrictedPath | null>(
    null,
  );

  const createAction = useAsyncAction();
  const deleteAction = useAsyncAction();

  const handleCreateSubmit = (values: RestrictedPathValues) => {
    void createAction.run(
      () => mutations.create(values),
      () => setIsCreateOpen(false),
    );
  };

  const handleDelete = () => {
    if (!deletingPath) return;
    void deleteAction.run(
      () => mutations.remove(deletingPath.id),
      () => setDeletingPath(null),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-base-content/60">
        Paths here can never be used as a redirect source, internal or
        external.
      </p>

      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Add restricted path"
            onClick={() => {
              createAction.reset();
              setIsCreateOpen(true);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      {list.isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : list.error ? (
        <FormErrorRibbon message={list.error} />
      ) : list.restrictedPaths.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <ShieldOff className="h-8 w-8 text-base-content/30" />
          <p className="text-sm text-base-content/60">
            No restricted paths yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.restrictedPaths.map((restrictedPath) => (
            <RestrictedPathRow
              key={restrictedPath.id}
              restrictedPath={restrictedPath}
              canManage={canManage}
              onDelete={() => {
                deleteAction.reset();
                setDeletingPath(restrictedPath);
              }}
            />
          ))}
        </div>
      )}

      <CreateRestrictedPathModal
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <ConfirmActionModal
        open={deletingPath !== null}
        icon={Trash2}
        title={`Remove restricted path ${deletingPath?.path}?`}
        description="This path becomes available as a redirect source again."
        confirmLabel="Remove"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingPath(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
