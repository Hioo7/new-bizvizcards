import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import FormStepShell from "@components/forms/FormStepShell";
import type { Customer } from "@app-types/customer";
import type {
  CreateEventAsEmployeePayload,
  EventSummary,
  UpdateEventPayload,
} from "@app-types/businessEvent";
import {
  EVENT_FORM_STEPS_CREATE,
  EVENT_FORM_STEPS_EDIT,
} from "@features/business-events/config";
import EventHostStep from "@features/business-events/components/EventHostStep";
import EventDetailsStep, {
  type EventDetailsDraft,
} from "@features/business-events/components/EventDetailsStep";

type EventFormModalProps =
  | {
      mode: "create";
      event?: undefined;
      open: boolean;
      isSubmitting: boolean;
      error: string | null;
      onCancel: () => void;
      onSubmit: (payload: CreateEventAsEmployeePayload) => void;
    }
  | {
      mode: "edit";
      event?: EventSummary;
      open: boolean;
      isSubmitting: boolean;
      error: string | null;
      onCancel: () => void;
      onSubmit: (payload: UpdateEventPayload) => void;
    };

interface EventFormDraft extends EventDetailsDraft {
  customerId: string;
  selectedCustomer: Customer | null;
}

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

function createDefaultDraft(): EventFormDraft {
  return {
    customerId: "",
    selectedCustomer: null,
    name: "",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
  };
}

function eventToDraft(event: EventSummary): EventFormDraft {
  return {
    customerId: event.hostCustomerId,
    selectedCustomer: null,
    name: event.name,
    description: event.description ?? "",
    location: event.location ?? "",
    startAt: toDatetimeLocalValue(event.startAt),
    endAt: event.endAt ? toDatetimeLocalValue(event.endAt) : "",
  };
}

function validateStep(stepId: string, draft: EventFormDraft): string | null {
  if (stepId === "host" && !draft.customerId) {
    return "Choose an event host to continue.";
  }
  if (stepId === "details") {
    if (!draft.name.trim()) return "Event name is required.";
    if (!draft.startAt) return "A start date/time is required.";
    if (draft.endAt && draft.endAt < draft.startAt) {
      return "End date/time must be on or after the start.";
    }
  }
  return null;
}

export default function EventFormModal(props: EventFormModalProps) {
  const { mode, event, open, isSubmitting, error, onCancel } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<EventFormDraft>(createDefaultDraft());
  const [stepError, setStepError] = useState<string | null>(null);

  const steps = mode === "create" ? EVENT_FORM_STEPS_CREATE : EVENT_FORM_STEPS_EDIT;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setCurrentIndex(0);
      setStepError(null);
      setDraft(mode === "edit" && event ? eventToDraft(event) : createDefaultDraft());
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mode, event]);

  const stepId = steps[currentIndex].id;
  const isLastStep = currentIndex === steps.length - 1;

  function handleNext() {
    const validationError = validateStep(stepId, draft);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

    if (isLastStep) {
      if (props.mode === "create") {
        props.onSubmit({
          customerId: draft.customerId,
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          location: draft.location.trim() || undefined,
          startAt: fromDatetimeLocalValue(draft.startAt),
          endAt: draft.endAt ? fromDatetimeLocalValue(draft.endAt) : undefined,
        });
      } else {
        props.onSubmit({
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          location: draft.location.trim() || undefined,
          startAt: fromDatetimeLocalValue(draft.startAt),
          endAt: draft.endAt ? fromDatetimeLocalValue(draft.endAt) : undefined,
        });
      }
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
      <div className="modal-box flex h-[85vh] w-full flex-col overflow-hidden p-0 sm:h-[70vh] sm:max-w-xl">
        <FormStepShell
          icon={CalendarDays}
          title={mode === "create" ? "Create event" : "Edit event"}
          accentColor="primary"
          steps={[...steps]}
          currentIndex={currentIndex}
          isSubmitting={isSubmitting}
          error={stepError ?? error}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={onCancel}
        >
          {stepId === "host" && (
            <EventHostStep
              selectedCustomerId={draft.customerId}
              selectedCustomer={draft.selectedCustomer}
              onSelect={(customer) =>
                setDraft({
                  ...draft,
                  customerId: customer.id,
                  selectedCustomer: customer,
                })
              }
            />
          )}
          {stepId === "details" && (
            <EventDetailsStep value={draft} onChange={(value) => setDraft({ ...draft, ...value })} />
          )}
        </FormStepShell>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
