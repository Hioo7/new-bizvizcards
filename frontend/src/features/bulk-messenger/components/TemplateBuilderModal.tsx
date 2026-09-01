import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import EditWizardShell from "@components/EditWizardShell";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type { BulkMessageTemplateSummary } from "@app-types/bulkMessenger";
import {
  BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_BUILDER_STEPS,
} from "@features/bulk-messenger/config/bulkMessenger.config";
import { findUnknownTokens } from "@features/bulk-messenger/utils/placeholderTokens";
import { useMyExchangeContactForms } from "@features/bulk-messenger/hooks/useMyExchangeContactForms";
import { useTemplatePlaceholders } from "@features/bulk-messenger/hooks/useTemplatePlaceholders";
import TemplateBasicsStep from "@features/bulk-messenger/components/builder-steps/TemplateBasicsStep";
import TemplateBodyStep from "@features/bulk-messenger/components/builder-steps/TemplateBodyStep";
import TemplateReviewStep from "@features/bulk-messenger/components/builder-steps/TemplateReviewStep";
import {
  createBulkMessageTemplate,
  getBulkMessageTemplate,
  updateBulkMessageTemplate,
} from "@services/bulkMessengerService";

interface TemplateDraft {
  name: string;
  linkedFormId: string | null;
  body: string;
}

// Mounted only while open (parent conditionally renders) so opening always
// starts from these initializers — no reset effect needed, matching
// HeroEditSheet's "remounts fresh" pattern.
interface TemplateBuilderModalProps {
  editingTemplate: BulkMessageTemplateSummary | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TemplateBuilderModal({
  editingTemplate,
  onClose,
  onSaved,
}: TemplateBuilderModalProps) {
  const isEdit = editingTemplate !== null;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<TemplateDraft>(() => ({
    name: editingTemplate?.name ?? "",
    linkedFormId: editingTemplate?.linkedFormId ?? null,
    body: "",
  }));
  const [initialLinkedFormId, setInitialLinkedFormId] = useState<string | null>(
    editingTemplate?.linkedFormId ?? null,
  );
  const [bodyNeedsReentry, setBodyNeedsReentry] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const forms = useMyExchangeContactForms();
  const placeholders = useTemplatePlaceholders(draft.linkedFormId);
  const saveAction = useAsyncAction();

  useEffect(() => {
    if (!editingTemplate) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await getBulkMessageTemplate(editingTemplate.id);
        if (cancelled) return;
        setDraft({
          name: detail.name,
          linkedFormId: detail.linkedFormId,
          body: detail.body,
        });
        setInitialLinkedFormId(detail.linkedFormId);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load template.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingTemplate]);

  const stepId = TEMPLATE_BUILDER_STEPS[currentIndex].id;
  const isLastStep = currentIndex === TEMPLATE_BUILDER_STEPS.length - 1;
  const linkedFormName =
    forms.forms.find((form) => form.id === draft.linkedFormId)?.name ?? null;

  function validateCurrentStep(): string | null {
    if (stepId === "basics") {
      const trimmed = draft.name.trim();
      if (!trimmed) return "Template name is required.";
      if (trimmed.length > BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH) {
        return `Template name must be ${BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH} characters or fewer.`;
      }
    }
    if (stepId === "body") {
      if (!draft.body.trim()) return "The message can't be empty.";
      if (!placeholders.isLoading) {
        const unknown = findUnknownTokens(
          draft.body,
          placeholders.availableTokens,
        );
        if (unknown.length > 0) {
          return "Remove the unknown placeholders before continuing.";
        }
      }
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

    // Only an EDIT needs the "re-enter your message" flow — a new template has
    // no prior message to invalidate, and step 2's unknown-token check already
    // blocks saving a body that references a now-unavailable form field.
    if (
      isEdit &&
      stepId === "basics" &&
      draft.linkedFormId !== initialLinkedFormId
    ) {
      setBodyNeedsReentry(true);
      setDraft((current) => ({ ...current, body: "" }));
      setInitialLinkedFormId(draft.linkedFormId);
    }

    if (isLastStep) {
      handleSave();
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  function handleBack() {
    setStepError(null);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function handleSave() {
    void saveAction.run(async () => {
      const payload = {
        name: draft.name.trim(),
        body: draft.body,
        linkedFormId: draft.linkedFormId,
      };
      if (isEdit && editingTemplate) {
        await updateBulkMessageTemplate(editingTemplate.id, payload);
      } else {
        await createBulkMessageTemplate(payload);
      }
    }, onSaved);
  }

  return (
    <EditWizardShell
      open
      icon={MessageSquareText}
      title={isEdit ? "Edit template" : "New template"}
      accentColor="primary"
      steps={[...TEMPLATE_BUILDER_STEPS]}
      currentIndex={currentIndex}
      isSubmitting={saveAction.isSubmitting}
      error={stepError ?? saveAction.error ?? loadError}
      onClose={onClose}
      onBack={handleBack}
      onNext={handleNext}
    >
      {stepId === "basics" && (
        <TemplateBasicsStep
          value={{ name: draft.name, linkedFormId: draft.linkedFormId }}
          onChange={(value) => setDraft((current) => ({ ...current, ...value }))}
          forms={forms.forms}
          formsLoading={forms.isLoading}
          formsError={forms.error}
        />
      )}
      {stepId === "body" && (
        <TemplateBodyStep
          body={draft.body}
          onChange={(body) => setDraft((current) => ({ ...current, body }))}
          core={placeholders.core}
          formFields={placeholders.formFields}
          availableTokens={placeholders.availableTokens}
          placeholdersLoading={placeholders.isLoading}
          bodyNeedsReentry={bodyNeedsReentry}
        />
      )}
      {stepId === "review" && (
        <TemplateReviewStep
          name={draft.name}
          linkedFormName={linkedFormName}
          body={draft.body}
        />
      )}
    </EditWizardShell>
  );
}
