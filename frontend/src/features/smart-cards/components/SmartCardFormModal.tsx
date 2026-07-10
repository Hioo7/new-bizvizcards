import { useEffect, useRef, useState } from "react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import InteriorDesignForm from "@features/smart-cards/components/interior-design-template/SmartCardForm";
import InteriorDesignTemplate2Form from "@features/smart-cards/components/interior-design-template-2/SmartCardForm";
import { useSmartCardMutations } from "@features/smart-cards/hooks/useSmartCardMutations";
import {
  buildSmartCardSubmission,
  smartCardToFormValues,
} from "@features/smart-cards/utils/smartCardFormMapping";
import { emptySmartCardFormValues } from "@features/smart-cards/types/smartCardForm.types";
import type { SmartCardFormValues } from "@features/smart-cards/types/smartCardForm.types";
import type { SmartCard, SmartCardTemplateKey } from "@app-types/smartCard";

interface SmartCardFormModalProps {
  templateKey: SmartCardTemplateKey;
  mode: "create" | "edit";
  card?: SmartCard;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SmartCardFormModal({
  templateKey,
  mode,
  card,
  open,
  onClose,
  onSuccess,
}: SmartCardFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitAction = useAsyncAction();
  const { reset: resetSubmitAction } = submitAction;
  const mutations = useSmartCardMutations(templateKey, () => undefined);
  const [submitCount, setSubmitCount] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) resetSubmitAction();
  }, [open, resetSubmitAction]);

  function handleSubmit(values: SmartCardFormValues) {
    void submitAction.run(
      async () => {
        const { payload, files } = buildSmartCardSubmission(values, templateKey);
        if (mode === "edit" && card) {
          await mutations.update(card.id, payload, files);
        } else {
          await mutations.create(payload, files);
        }
      },
      () => {
        setSubmitCount((count) => count + 1);
        onSuccess();
      },
    );
  }

  const initialValues: SmartCardFormValues =
    mode === "edit" && card ? smartCardToFormValues(card) : emptySmartCardFormValues();
  const remountKey = `${mode}-${card?.id ?? "new"}-${submitCount}`;

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box flex h-[92vh] w-full flex-col overflow-hidden p-0 sm:h-[85vh] sm:max-w-2xl">
        {templateKey === "INTERIOR_DESIGN_TEMPLATE_2" ? (
          <InteriorDesignTemplate2Form
            key={remountKey}
            initialValues={initialValues}
            isSubmitting={submitAction.isSubmitting}
            error={submitAction.error}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        ) : (
          <InteriorDesignForm
            key={remountKey}
            initialValues={initialValues}
            isSubmitting={submitAction.isSubmitting}
            error={submitAction.error}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
