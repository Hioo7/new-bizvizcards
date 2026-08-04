import { useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { MessageSquareQuote, Trash2 } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import StarRatingField from "@features/ecards/components/StarRatingField";
import type { TestimonialsSheetValues } from "@features/ecards/schemas/ecardComponentSchemas";

interface TestimonialEntryRowProps {
  fieldId: string;
  index: number;
  control: Control<TestimonialsSheetValues>;
  register: UseFormRegister<TestimonialsSheetValues>;
  setValue: UseFormSetValue<TestimonialsSheetValues>;
  errors: FieldErrors<TestimonialsSheetValues>;
  onRemove: () => void;
}

export default function TestimonialEntryRow({
  fieldId,
  index,
  control,
  register,
  setValue,
  errors,
  onRemove,
}: TestimonialEntryRowProps) {
  const rating = useWatch({ control, name: `entries.${index}.rating` });

  return (
    <div className="flex flex-col gap-3 rounded-field border border-base-300 p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          <MessageSquareQuote className="h-3.5 w-3.5" />
          Testimonial {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove testimonial ${index + 1}`}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <FormTextField
        id={`ecard-testimonial-name-${fieldId}`}
        label="Name"
        icon={MessageSquareQuote}
        registration={register(`entries.${index}.name`)}
        error={errors.entries?.[index]?.name?.message}
      />
      <StarRatingField
        label="Rating"
        value={rating}
        onChange={(value) =>
          setValue(`entries.${index}.rating`, value, { shouldValidate: true })
        }
      />
      <FormTextareaField
        id={`ecard-testimonial-text-${fieldId}`}
        label="Testimonial"
        rows={2}
        registration={register(`entries.${index}.text`)}
        error={errors.entries?.[index]?.text?.message}
      />
    </div>
  );
}
