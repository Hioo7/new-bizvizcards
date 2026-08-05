import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import FormStepShell from "@components/forms/FormStepShell";
import type { EmailSignature } from "@app-types/emailSignature";
import { EMAIL_SIGNATURE_BUILDER_STEPS } from "@features/email-signatures/config/emailSignatureBuilder.config";
import CtaStep from "@features/email-signatures/components/builder-steps/CtaStep";
import ContentFieldsStep from "@features/email-signatures/components/builder-steps/ContentFieldsStep";
import ReviewPreviewStep from "@features/email-signatures/components/builder-steps/ReviewPreviewStep";
import SocialLinksStep from "@features/email-signatures/components/builder-steps/SocialLinksStep";
import TemplatePickerStep from "@features/email-signatures/components/builder-steps/TemplatePickerStep";
import type { EmailSignatureDraft } from "@features/email-signatures/types/emailSignatureDraft";
import {
  buildEmailSignaturePayload,
  createDefaultEmailSignatureDraft,
  emailSignatureToDraft,
} from "@features/email-signatures/utils/emailSignatureDraft.util";
import {
  createMyEmailSignature,
  updateMyEmailSignature,
} from "@services/emailSignatureService";

interface EmailSignatureBuilderModalProps {
  mode: "create" | "edit";
  signature?: EmailSignature;
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function validateStep(
  stepId: string,
  draft: EmailSignatureDraft,
): string | null {
  if (stepId === "content") {
    if (!draft.name.trim()) return "Give this signature a name.";
    if (!draft.fullName.trim()) return "Full name is required.";
  }
  return null;
}

export default function EmailSignatureBuilderModal({
  mode,
  signature,
  open,
  onCancel,
  onSaved,
}: EmailSignatureBuilderModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<EmailSignatureDraft>(
    createDefaultEmailSignatureDraft(),
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setCurrentIndex(0);
      setStepError(null);
      setSubmitError(null);
      setDraft(
        mode === "edit" && signature
          ? emailSignatureToDraft(signature)
          : createDefaultEmailSignatureDraft(),
      );
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mode, signature]);

  const stepId = EMAIL_SIGNATURE_BUILDER_STEPS[currentIndex].id;
  const isLastStep = currentIndex === EMAIL_SIGNATURE_BUILDER_STEPS.length - 1;

  async function handleSave() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { payload, files } = buildEmailSignaturePayload(draft);
      if (mode === "edit" && signature) {
        await updateMyEmailSignature(signature.id, payload, files);
      } else {
        await createMyEmailSignature(payload, files);
      }
      onSaved();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save signature.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    const validationError = validateStep(stepId, draft);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

    if (isLastStep) {
      void handleSave();
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  function handleBack() {
    setStepError(null);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box flex h-[92vh] w-full flex-col overflow-hidden p-0 sm:h-[85vh] sm:max-w-2xl">
        <FormStepShell
          icon={Mail}
          title={mode === "create" ? "New email signature" : "Edit signature"}
          accentColor="primary"
          steps={[...EMAIL_SIGNATURE_BUILDER_STEPS]}
          currentIndex={currentIndex}
          isSubmitting={isSubmitting}
          error={stepError ?? submitError}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={onCancel}
        >
          {stepId === "template" && (
            <TemplatePickerStep
              value={draft.templateKey}
              onChange={(templateKey) => setDraft({ ...draft, templateKey })}
            />
          )}
          {stepId === "content" && (
            <ContentFieldsStep value={draft} onChange={setDraft} />
          )}
          {stepId === "cta" && <CtaStep value={draft} onChange={setDraft} />}
          {stepId === "social" && (
            <SocialLinksStep value={draft} onChange={setDraft} />
          )}
          {stepId === "review" && <ReviewPreviewStep value={draft} />}
        </FormStepShell>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
