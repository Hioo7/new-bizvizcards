import { forwardRef, useImperativeHandle } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareQuote, Plus, Trash2 } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import EmptyStepState from "@features/smart-cards/components/EmptyStepState";
import { testimonialsStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import { SMART_CARD_MAX_TESTIMONIALS } from "@features/smart-cards/config/smartCardForm.config";
import type {
  SmartCardStepHandle,
  TestimonialsStepValues,
} from "@features/smart-cards/types/smartCardForm.types";

interface TestimonialsStepProps {
  defaultValues: TestimonialsStepValues;
}

const TestimonialsStep = forwardRef<
  SmartCardStepHandle<TestimonialsStepValues>,
  TestimonialsStepProps
>(function TestimonialsStep({ defaultValues }, ref) {
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<TestimonialsStepValues>({
    resolver: zodResolver(testimonialsStepSchema),
    defaultValues,
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "testimonials",
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const valid = await trigger();
      return valid ? getValues() : null;
    },
    getDraft: () => getValues(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/60">
          Testimonials
        </h3>
        {fields.length < SMART_CARD_MAX_TESTIMONIALS && (
          <button
            type="button"
            aria-label="Add testimonial"
            onClick={() => append({ name: "", initials: "", text: "" })}
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
        <div key={field.id} className="flex flex-col gap-3 rounded-field border border-base-300 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              Testimonial {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove testimonial ${index + 1}`}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormTextField
              id={`sc-testimonial-name-${field.id}`}
              label="Name"
              icon={MessageSquareQuote}
              registration={register(`testimonials.${index}.name`)}
              error={errors.testimonials?.[index]?.name?.message}
            />
            <FormTextField
              id={`sc-testimonial-initials-${field.id}`}
              label="Initials"
              icon={MessageSquareQuote}
              registration={register(`testimonials.${index}.initials`)}
              error={errors.testimonials?.[index]?.initials?.message}
            />
          </div>
          <FormTextareaField
            id={`sc-testimonial-text-${field.id}`}
            label="Testimonial"
            rows={2}
            registration={register(`testimonials.${index}.text`)}
            error={errors.testimonials?.[index]?.text?.message}
          />
        </div>
      ))}
    </div>
  );
});

export default TestimonialsStep;
