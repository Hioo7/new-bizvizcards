import { useState } from "react";
import { Plus, Route, Trash2 } from "lucide-react";
import { useInternalRedirects } from "@features/redirects/hooks/useInternalRedirects";
import { useInternalRedirectMutations } from "@features/redirects/hooks/useInternalRedirectMutations";
import { useAsyncAction } from "@hooks/useAsyncAction";
import InternalRedirectRow from "@features/redirects/components/InternalRedirectRow";
import CreateInternalRedirectModal from "@features/redirects/components/CreateInternalRedirectModal";
import EditInternalRedirectModal from "@features/redirects/components/EditInternalRedirectModal";
import ConfirmActionModal from "@components/ConfirmActionModal";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import type { InternalRedirect } from "@features/redirects/types/redirects.types";
import type { InternalRedirectValues } from "@features/redirects/schemas/internalRedirectSchema";

interface InternalRedirectsPanelProps {
  canManage: boolean;
}

export default function InternalRedirectsPanel({
  canManage,
}: InternalRedirectsPanelProps) {
  const list = useInternalRedirects();
  const mutations = useInternalRedirectMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] =
    useState<InternalRedirect | null>(null);
  const [deletingRedirect, setDeletingRedirect] =
    useState<InternalRedirect | null>(null);

  const createAction = useAsyncAction();
  const editAction = useAsyncAction();
  const deleteAction = useAsyncAction();
  const toggleAction = useAsyncAction();

  const handleCreateSubmit = (values: InternalRedirectValues) => {
    void createAction.run(
      () => mutations.create(values),
      () => setIsCreateOpen(false),
    );
  };

  const handleEditSubmit = (values: InternalRedirectValues) => {
    if (!editingRedirect) return;
    void editAction.run(
      () => mutations.update(editingRedirect.id, values),
      () => setEditingRedirect(null),
    );
  };

  const handleDelete = () => {
    if (!deletingRedirect) return;
    void deleteAction.run(
      () => mutations.remove(deletingRedirect.id),
      () => setDeletingRedirect(null),
    );
  };

  const handleToggleEnabled = (redirect: InternalRedirect) => {
    void toggleAction.run(
      () => mutations.update(redirect.id, { enabled: !redirect.enabled }),
      () => undefined,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Add internal redirect"
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
      ) : list.redirects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Route className="h-8 w-8 text-base-content/30" />
          <p className="text-sm text-base-content/60">
            No internal redirects yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.redirects.map((redirect) => (
            <InternalRedirectRow
              key={redirect.id}
              redirect={redirect}
              canManage={canManage}
              onToggleEnabled={() => handleToggleEnabled(redirect)}
              onEdit={() => {
                editAction.reset();
                setEditingRedirect(redirect);
              }}
              onDelete={() => {
                deleteAction.reset();
                setDeletingRedirect(redirect);
              }}
            />
          ))}
        </div>
      )}

      <CreateInternalRedirectModal
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditInternalRedirectModal
        open={editingRedirect !== null}
        redirect={editingRedirect}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setEditingRedirect(null)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmActionModal
        open={deletingRedirect !== null}
        icon={Trash2}
        title={`Delete redirect from ${deletingRedirect?.sourcePath}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingRedirect(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
