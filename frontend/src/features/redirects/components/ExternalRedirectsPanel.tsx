import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useExternalRedirects } from "@features/redirects/hooks/useExternalRedirects";
import { useExternalRedirectMutations } from "@features/redirects/hooks/useExternalRedirectMutations";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ExternalRedirectRow from "@features/redirects/components/ExternalRedirectRow";
import CreateExternalRedirectModal from "@features/redirects/components/CreateExternalRedirectModal";
import EditExternalRedirectModal from "@features/redirects/components/EditExternalRedirectModal";
import ConfirmActionModal from "@components/ConfirmActionModal";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import type { ExternalRedirect } from "@features/redirects/types/redirects.types";
import type { ExternalRedirectValues } from "@features/redirects/schemas/externalRedirectSchema";

interface ExternalRedirectsPanelProps {
  canManage: boolean;
}

export default function ExternalRedirectsPanel({
  canManage,
}: ExternalRedirectsPanelProps) {
  const list = useExternalRedirects();
  const mutations = useExternalRedirectMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] =
    useState<ExternalRedirect | null>(null);
  const [deletingRedirect, setDeletingRedirect] =
    useState<ExternalRedirect | null>(null);

  const createAction = useAsyncAction();
  const editAction = useAsyncAction();
  const deleteAction = useAsyncAction();
  const toggleAction = useAsyncAction();

  const handleCreateSubmit = (values: ExternalRedirectValues) => {
    void createAction.run(
      () => mutations.create(values),
      () => setIsCreateOpen(false),
    );
  };

  const handleEditSubmit = (values: ExternalRedirectValues) => {
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

  const handleToggleEnabled = (redirect: ExternalRedirect) => {
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
            aria-label="Add external redirect"
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
          <ExternalLink className="h-8 w-8 text-base-content/30" />
          <p className="text-sm text-base-content/60">
            No external redirects yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.redirects.map((redirect) => (
            <ExternalRedirectRow
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

      <CreateExternalRedirectModal
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditExternalRedirectModal
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
