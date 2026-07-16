import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import FormStepShell from "@components/forms/FormStepShell";
import type { CreatePlanPayload, PlanDetail } from "@app-types/plan";
import { PLAN_FORM_STEPS } from "@features/plans/config";
import { createDefaultPlanDraft } from "@features/plans/utils/planFormDefaults";
import PlanBasicsStep from "@features/plans/components/PlanBasicsStep";
import PlanReviewStep from "@features/plans/components/PlanReviewStep";
import EcardPolicyFields from "@features/plans/components/policy-fields/EcardPolicyFields";
import SmartCardPolicyFields from "@features/plans/components/policy-fields/SmartCardPolicyFields";
import OrganisationPolicyFields from "@features/plans/components/policy-fields/OrganisationPolicyFields";
import EventPolicyFields from "@features/plans/components/policy-fields/EventPolicyFields";

interface PlanFormModalProps {
  mode: "create" | "edit";
  plan?: PlanDetail;
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (draft: CreatePlanPayload) => void;
}

function planToDraft(plan: PlanDetail): CreatePlanPayload {
  return {
    name: plan.name,
    price: plan.price,
    businessModelType: plan.businessModelType,
    subscriptionDurationMonths: plan.subscriptionDurationMonths ?? undefined,
    isPublic: plan.isPublic,
    ecardPolicy: plan.ecardPolicy,
    smartCardPolicy: plan.smartCardPolicy,
    organisationPolicy: plan.organisationPolicy,
    eventPolicy: plan.eventPolicy,
  };
}

function validateStep(stepId: string, draft: CreatePlanPayload): string | null {
  if (stepId === "basics") {
    if (!draft.name.trim()) return "Plan name is required.";
    if (draft.price < 0) return "Price cannot be negative.";
    if (
      draft.businessModelType === "SUBSCRIPTION" &&
      !draft.subscriptionDurationMonths
    ) {
      return "Subscription duration is required.";
    }
  }
  return null;
}

export default function PlanFormModal({
  mode,
  plan,
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: PlanFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<CreatePlanPayload>(createDefaultPlanDraft());
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setCurrentIndex(0);
      setStepError(null);
      setDraft(
        mode === "edit" && plan ? planToDraft(plan) : createDefaultPlanDraft(),
      );
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mode, plan]);

  const stepId = PLAN_FORM_STEPS[currentIndex].id;
  const isLastStep = currentIndex === PLAN_FORM_STEPS.length - 1;

  function handleNext() {
    const validationError = validateStep(stepId, draft);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

    if (isLastStep) {
      onSubmit(draft);
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
          icon={CreditCard}
          title={mode === "create" ? "Create plan" : "Edit plan"}
          accentColor="primary"
          steps={[...PLAN_FORM_STEPS]}
          currentIndex={currentIndex}
          isSubmitting={isSubmitting}
          error={stepError ?? error}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={onCancel}
        >
          {stepId === "basics" && (
            <PlanBasicsStep value={draft} onChange={setDraft} />
          )}
          {stepId === "ecard" && (
            <EcardPolicyFields
              value={draft.ecardPolicy}
              onChange={(ecardPolicy) => setDraft({ ...draft, ecardPolicy })}
            />
          )}
          {stepId === "smart-card" && (
            <SmartCardPolicyFields
              value={draft.smartCardPolicy}
              onChange={(smartCardPolicy) =>
                setDraft({ ...draft, smartCardPolicy })
              }
            />
          )}
          {stepId === "organisation" && (
            <OrganisationPolicyFields
              value={draft.organisationPolicy}
              onChange={(organisationPolicy) =>
                setDraft({ ...draft, organisationPolicy })
              }
            />
          )}
          {stepId === "event" && (
            <EventPolicyFields
              value={draft.eventPolicy}
              onChange={(eventPolicy) => setDraft({ ...draft, eventPolicy })}
            />
          )}
          {stepId === "review" && <PlanReviewStep value={draft} />}
        </FormStepShell>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
