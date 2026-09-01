import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Send, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type { BulkMessageSendSummary } from "@app-types/bulkMessenger";
import { userBulkMessengerSendPath } from "@config/routes";
import { useBulkMessageSendList } from "@features/bulk-messenger/hooks/useBulkMessageSendList";
import { useBulkMessageTemplateList } from "@features/bulk-messenger/hooks/useBulkMessageTemplateList";
import SendRow from "@features/bulk-messenger/components/SendRow";
import SendWizardModal from "@features/bulk-messenger/components/SendWizardModal";
import { deleteBulkMessageSend } from "@services/bulkMessengerService";

interface SendsTabProps {
  onGoToTemplates: () => void;
}

export default function SendsTab({ onGoToTemplates }: SendsTabProps) {
  const navigate = useNavigate();
  const list = useBulkMessageSendList();
  const templates = useBulkMessageTemplateList();
  const deleteAction = useAsyncAction();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleting, setDeleting] = useState<BulkMessageSendSummary | null>(null);

  function handleDelete() {
    if (!deleting) return;
    void deleteAction.run(
      () => deleteBulkMessageSend(deleting.id),
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
          {list.sends.length} {list.sends.length === 1 ? "send" : "sends"}
        </p>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="flex min-h-11 items-center gap-2 rounded-field bg-secondary px-3 text-sm font-semibold text-secondary-content hover:bg-secondary/90"
        >
          <Plus className="h-4 w-4" />
          New send
        </button>
      </div>

      {list.isLoading && (
        <p className="text-sm text-base-content/50">Loading…</p>
      )}
      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && !list.error && list.sends.length === 0 && (
        <EmptyStepState
          icon={Send}
          message="No sends yet. Pick a template and start a send."
        />
      )}

      {list.sends.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {list.sends.map((send) => (
            <SendRow
              key={send.id}
              send={send}
              onOpen={() => navigate(userBulkMessengerSendPath(send.id))}
              onDelete={() => {
                deleteAction.reset();
                setDeleting(send);
              }}
            />
          ))}
        </div>
      )}

      {wizardOpen && (
        <SendWizardModal
          templates={templates.templates}
          templatesLoading={templates.isLoading}
          templatesError={templates.error}
          onClose={() => setWizardOpen(false)}
          onCreated={(sendId) => {
            setWizardOpen(false);
            navigate(userBulkMessengerSendPath(sendId));
          }}
          onGoToTemplates={() => {
            setWizardOpen(false);
            onGoToTemplates();
          }}
        />
      )}

      <ConfirmActionModal
        open={deleting !== null}
        icon={Trash2}
        title="Delete this send?"
        description="This permanently removes the send and its recipient history."
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
