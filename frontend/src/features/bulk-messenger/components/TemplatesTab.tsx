import { useState } from "react";
import { MessageSquareText, Plus, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type { BulkMessageTemplateSummary } from "@app-types/bulkMessenger";
import { useBulkMessageTemplateList } from "@features/bulk-messenger/hooks/useBulkMessageTemplateList";
import TemplateBuilderModal from "@features/bulk-messenger/components/TemplateBuilderModal";
import TemplateRow from "@features/bulk-messenger/components/TemplateRow";
import { deleteBulkMessageTemplate } from "@services/bulkMessengerService";

export default function TemplatesTab() {
  const list = useBulkMessageTemplateList();
  const deleteAction = useAsyncAction();
  const [builderState, setBuilderState] = useState<
    { mode: "closed" } | { mode: "create" } | {
      mode: "edit";
      template: BulkMessageTemplateSummary;
    }
  >({ mode: "closed" });
  const [deleting, setDeleting] = useState<BulkMessageTemplateSummary | null>(
    null,
  );

  function handleDelete() {
    if (!deleting) return;
    void deleteAction.run(
      () => deleteBulkMessageTemplate(deleting.id),
      () => {
        setDeleting(null);
        list.refetch();
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-base-content/60">
          {list.templates.length}{" "}
          {list.templates.length === 1 ? "template" : "templates"}
        </p>
        <button
          type="button"
          aria-label="New template"
          onClick={() => setBuilderState({ mode: "create" })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {list.isLoading && (
        <p className="text-sm text-base-content/50">Loading…</p>
      )}
      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && !list.error && list.templates.length === 0 && (
        <EmptyStepState
          icon={MessageSquareText}
          message="No message templates yet. Tap + above to create one."
        />
      )}

      {list.templates.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {list.templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              onEdit={() => setBuilderState({ mode: "edit", template })}
              onDelete={() => {
                deleteAction.reset();
                setDeleting(template);
              }}
            />
          ))}
        </div>
      )}

      {(builderState.mode === "create" || builderState.mode === "edit") && (
        <TemplateBuilderModal
          editingTemplate={
            builderState.mode === "edit" ? builderState.template : null
          }
          onClose={() => setBuilderState({ mode: "closed" })}
          onSaved={() => {
            setBuilderState({ mode: "closed" });
            list.refetch();
          }}
        />
      )}

      <ConfirmActionModal
        open={deleting !== null}
        icon={Trash2}
        title={`Delete ${deleting?.name ?? "this template"}?`}
        description="This removes the template. Past sends and their history are kept."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
