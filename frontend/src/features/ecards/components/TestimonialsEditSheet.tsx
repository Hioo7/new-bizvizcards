import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareQuote, Plus } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import EditSheetShell from "@components/EditSheetShell";
import TestimonialEntryRow from "@features/ecards/components/TestimonialEntryRow";
import {
  testimonialsSheetSchema,
  type TestimonialsSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import { ECARD_MAX_TESTIMONIALS } from "@features/ecards/config/ecardBuilder.config";
import type { TestimonialsComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface TestimonialsEditSheetProps {
  open: boolean;
  draft: TestimonialsComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: TestimonialsComponentDraft) => void;
}

export default function TestimonialsEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: TestimonialsEditSheetProps) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TestimonialsSheetValues>({
    resolver: zodResolver(testimonialsSheetSchema),
    defaultValues: { entries: draft.entries },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "entries" });

  function submit(values: TestimonialsSheetValues) {
    onSave({ type: "TESTIMONIALS", entries: values.entries });
  }

  return (
    <EditSheetShell
      open={open}
      icon={MessageSquareQuote}
      title="Testimonials"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-base-content/60">
          Shown as a rotating carousel on the card.
        </p>
        {fields.length < ECARD_MAX_TESTIMONIALS && (
          <button
            type="button"
            aria-label="Add testimonial"
            onClick={() => append({ name: "", rating: 5, text: "" })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {fields.length === 0 && (
        <EmptyStepState icon={MessageSquareQuote} message="No testimonials added yet." />
      )}

      {fields.map((field, index) => (
        <TestimonialEntryRow
          key={field.id}
          fieldId={field.id}
          index={index}
          control={control}
          register={register}
          setValue={setValue}
          errors={errors}
          onRemove={() => remove(index)}
        />
      ))}
    </EditSheetShell>
  );
}
