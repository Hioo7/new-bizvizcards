import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import FormStepShell from "@components/forms/FormStepShell";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { createVirtualBackground } from "@services/virtualBackgroundService";
import type { Ecard } from "@app-types/ecard";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";
import { VIRTUAL_BACKGROUND_BUILDER_STEPS } from "@features/virtual-backgrounds/config";
import {
  createEmptyVirtualBackgroundDraft,
  type VirtualBackgroundDraft,
} from "@features/virtual-backgrounds/types/virtualBackgroundDraft";
import BaseImageStep from "@features/virtual-backgrounds/components/steps/BaseImageStep";
import CornerCaptionStep from "@features/virtual-backgrounds/components/steps/CornerCaptionStep";
import PreviewStep from "@features/virtual-backgrounds/components/steps/PreviewStep";

interface VirtualBackgroundCreateModalProps {
  open: boolean;
  ecards: Ecard[];
  templates: VirtualBackgroundTemplateSummary[];
  allowCustomBackground: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function validateStep(
  stepId: string,
  draft: VirtualBackgroundDraft,
): string | null {
  if (stepId === "base-image") {
    if (!draft.ecardId) return "Select which e-card to link.";
    if (draft.source === "TEMPLATE" && !draft.templateId) {
      return "Choose a base image.";
    }
    if (draft.source === "CUSTOM" && !draft.customFile) {
      return "Choose a base image.";
    }
    if (!draft.source) return "Choose a base image.";
  }
  return null;
}

export default function VirtualBackgroundCreateModal({
  open,
  ecards,
  templates,
  allowCustomBackground,
  onCancel,
  onSaved,
}: VirtualBackgroundCreateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<VirtualBackgroundDraft>(
    createEmptyVirtualBackgroundDraft(),
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const saveAction = useAsyncAction();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setCurrentIndex(0);
      setStepError(null);
      saveAction.reset();
      setDraft({
        ...createEmptyVirtualBackgroundDraft(),
        ecardId: ecards.length === 1 ? ecards[0].id : null,
      });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ecards]);

  const stepId = VIRTUAL_BACKGROUND_BUILDER_STEPS[currentIndex].id;
  const isLastStep = currentIndex === VIRTUAL_BACKGROUND_BUILDER_STEPS.length - 1;

  function handleSave() {
    if (!draft.ecardId || !draft.source) return;
    void saveAction.run(
      async () => {
        if (draft.source === "TEMPLATE" && draft.templateId) {
          await createVirtualBackground(
            {
              source: "TEMPLATE",
              templateId: draft.templateId,
              ecardId: draft.ecardId!,
              qrCorner: draft.qrCorner,
              captionText: draft.captionText.trim() || undefined,
            },
            undefined,
          );
        } else if (draft.source === "CUSTOM" && draft.customFile) {
          await createVirtualBackground(
            {
              source: "CUSTOM",
              ecardId: draft.ecardId!,
              qrCorner: draft.qrCorner,
              captionText: draft.captionText.trim() || undefined,
            },
            draft.customFile,
          );
        }
      },
      onSaved,
    );
  }

  function handleNext() {
    const validationError = validateStep(stepId, draft);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

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

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box flex h-[92vh] w-full flex-col overflow-hidden p-0 sm:h-[85vh] sm:max-w-2xl">
        <FormStepShell
          icon={ImageIcon}
          title="New virtual background"
          accentColor="primary"
          steps={[...VIRTUAL_BACKGROUND_BUILDER_STEPS]}
          currentIndex={currentIndex}
          isSubmitting={saveAction.isSubmitting}
          error={stepError ?? saveAction.error}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={onCancel}
        >
          {stepId === "base-image" && (
            <BaseImageStep
              ecards={ecards}
              templates={templates}
              allowCustomBackground={allowCustomBackground}
              value={draft}
              onChange={setDraft}
            />
          )}
          {stepId === "corner-caption" && (
            <CornerCaptionStep value={draft} onChange={setDraft} />
          )}
          {stepId === "preview" && (
            <PreviewStep value={draft} ecards={ecards} templates={templates} />
          )}
        </FormStepShell>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
