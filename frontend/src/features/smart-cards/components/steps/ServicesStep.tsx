import { forwardRef, useImperativeHandle } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Wrench } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import ImageSlotField from "@features/smart-cards/components/ImageSlotField";
import EmptyStepState from "@features/smart-cards/components/EmptyStepState";
import { servicesStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import { SMART_CARD_MAX_SERVICES } from "@features/smart-cards/config/smartCardForm.config";
import { emptyImageField } from "@features/smart-cards/types/smartCardForm.types";
import type {
  ServicesStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";

interface ServicesStepProps {
  defaultValues: ServicesStepValues;
}

const ServicesStep = forwardRef<
  SmartCardStepHandle<ServicesStepValues>,
  ServicesStepProps
>(function ServicesStep({ defaultValues }, ref) {
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ServicesStepValues>({
    resolver: zodResolver(servicesStepSchema),
    defaultValues,
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "services" });

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
          Services
        </h3>
        {fields.length < SMART_CARD_MAX_SERVICES && (
          <button
            type="button"
            aria-label="Add service"
            onClick={() => append({ title: "", description: "", image: emptyImageField() })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {fields.length === 0 && (
        <EmptyStepState icon={Wrench} message="No services added yet." />
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-3 rounded-field border border-base-300 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              <Wrench className="h-3.5 w-3.5" />
              Service {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove service ${index + 1}`}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <FormTextField
            id={`sc-service-title-${field.id}`}
            label="Title"
            icon={Wrench}
            registration={register(`services.${index}.title`)}
            error={errors.services?.[index]?.title?.message}
          />
          <FormTextareaField
            id={`sc-service-description-${field.id}`}
            label="Description"
            rows={2}
            registration={register(`services.${index}.description`)}
            error={errors.services?.[index]?.description?.message}
          />
          <Controller
            control={control}
            name={`services.${index}.image`}
            render={({ field: imageField }) => (
              <ImageSlotField
                label="Image"
                value={imageField.value}
                onChange={imageField.onChange}
                aspect={1}
                cropShape="rect"
              />
            )}
          />
        </div>
      ))}
    </div>
  );
});

export default ServicesStep;
