import { useState } from "react";
import { Send } from "lucide-react";
import EditWizardShell from "@components/EditWizardShell";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type {
  BulkMessageTemplateSummary,
  ValidLeadRow,
} from "@app-types/bulkMessenger";
import { SEND_WIZARD_STEPS } from "@features/bulk-messenger/config/bulkMessenger.config";
import { useTemplateValidLeads } from "@features/bulk-messenger/hooks/useTemplateValidLeads";
import SendTemplatePickerStep from "@features/bulk-messenger/components/send-steps/SendTemplatePickerStep";
import SendRecipientsStep from "@features/bulk-messenger/components/send-steps/SendRecipientsStep";
import SendReviewStep from "@features/bulk-messenger/components/send-steps/SendReviewStep";
import { createBulkMessageSend } from "@services/bulkMessengerService";

interface SendWizardModalProps {
  templates: BulkMessageTemplateSummary[];
  templatesLoading: boolean;
  templatesError: string | null;
  onClose: () => void;
  onCreated: (sendId: string) => void;
  onGoToTemplates: () => void;
}

function defaultSelection(rows: ValidLeadRow[]): Set<string> {
  return new Set(
    rows.filter((row) => row.hasUsablePhone).map((row) => row.leadId),
  );
}

// Mounted only while open (parent conditionally renders).
export default function SendWizardModal({
  templates,
  templatesLoading,
  templatesError,
  onClose,
  onCreated,
  onGoToTemplates,
}: SendWizardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [templateId, setTemplateId] = useState<string | null>(null);
  // null = untouched, fall back to "every selectable recipient".
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const validLeads = useTemplateValidLeads(templateId);
  const createAction = useAsyncAction();

  const stepId = SEND_WIZARD_STEPS[currentIndex].id;
  const isLastStep = currentIndex === SEND_WIZARD_STEPS.length - 1;
  const templateName =
    templates.find((template) => template.id === templateId)?.name ?? "—";
  const selection = selectedIds ?? defaultSelection(validLeads.rows);

  function toggle(leadId: string) {
    const next = new Set(selection);
    if (next.has(leadId)) next.delete(leadId);
    else next.add(leadId);
    setSelectedIds(next);
  }

  function validateCurrentStep(): string | null {
    if (stepId === "template" && !templateId) return "Pick a template.";
    if (stepId === "recipients" && selection.size === 0) {
      return "Select at least one recipient.";
    }
    return null;
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    if (isLastStep) {
      handleCreate();
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  function handleCreate() {
    if (!templateId) return;
    void createAction.run(async () => {
      const send = await createBulkMessageSend({
        templateId,
        leadIds: [...selection],
      });
      onCreated(send.id);
    }, () => undefined);
  }

  return (
    <EditWizardShell
      open
      icon={Send}
      title="New send"
      accentColor="secondary"
      steps={[...SEND_WIZARD_STEPS]}
      currentIndex={currentIndex}
      isSubmitting={createAction.isSubmitting}
      error={stepError ?? createAction.error}
      onClose={onClose}
      onBack={() => {
        setStepError(null);
        setCurrentIndex((index) => Math.max(0, index - 1));
      }}
      onNext={handleNext}
    >
      {stepId === "template" && (
        <SendTemplatePickerStep
          templates={templates}
          isLoading={templatesLoading}
          error={templatesError}
          selectedId={templateId}
          onSelect={(id) => {
            setTemplateId(id);
            setSelectedIds(null);
          }}
          onGoToTemplates={onGoToTemplates}
        />
      )}
      {stepId === "recipients" && (
        <SendRecipientsStep
          rows={validLeads.rows}
          isLoading={validLeads.isLoading}
          error={validLeads.error}
          selectedIds={selection}
          onToggle={toggle}
          onSelectAll={() => setSelectedIds(defaultSelection(validLeads.rows))}
          onClearAll={() => setSelectedIds(new Set())}
        />
      )}
      {stepId === "review" && (
        <SendReviewStep
          templateName={templateName}
          recipientCount={selection.size}
        />
      )}
    </EditWizardShell>
  );
}
