import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import EditSheetShell from "@components/EditSheetShell";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import {
  choiceFieldSheetSchema,
  type ChoiceFieldSheetValues,
} from "@features/exchange-contact-forms/schemas/exchangeContactFormFieldSchemas";
import {
  EXCHANGE_CONTACT_FIELD_MAX_OPTIONS,
  EXCHANGE_CONTACT_FIELD_MIN_OPTIONS,
  FIELD_TYPE_ICON,
  FIELD_TYPE_LABEL,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import type {
  DropdownFieldDraft,
  MultipleChoiceFieldDraft,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";

type ChoiceDraft = MultipleChoiceFieldDraft | DropdownFieldDraft;

interface ChoiceFieldEditSheetProps {
  open: boolean;
  draft: ChoiceDraft;
  onClose: () => void;
  onSave: (draft: ChoiceDraft) => void;
}

export default function ChoiceFieldEditSheet({
  open,
  draft,
  onClose,
  onSave,
}: ChoiceFieldEditSheetProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChoiceFieldSheetValues>({
    resolver: zodResolver(choiceFieldSheetSchema),
    defaultValues: {
      label: draft.label,
      helpText: draft.helpText,
      isRequired: draft.isRequired,
      options: draft.options,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  const Icon = FIELD_TYPE_ICON[draft.type];
  const title = FIELD_TYPE_LABEL[draft.type];

  function submit(values: ChoiceFieldSheetValues) {
    onSave({
      ...draft,
      label: values.label,
      helpText: values.helpText,
      isRequired: values.isRequired,
      options: values.options,
    });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Icon}
      title={title}
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      error={null}
    >
      <FormTextField
        id="field-label"
        label="Question"
        icon={Icon}
        registration={register("label")}
        error={errors.label?.message}
      />
      <FormTextareaField
        id="field-help-text"
        label="Help text (optional)"
        rows={2}
        registration={register("helpText")}
        error={errors.helpText?.message}
      />
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-3">
        <span className="text-sm font-medium text-base-content">Required</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          {...register("isRequired")}
        />
      </label>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-base-content/70">
          Options
        </p>
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  {...register(`options.${index}.label` as const)}
                  placeholder={`Option ${index + 1}`}
                  className={`min-h-11 w-full rounded-field border bg-base-200 px-3 text-sm text-base-content transition focus:bg-base-100 focus:outline-none ${
                    errors.options?.[index]?.label
                      ? "border-error focus:border-error"
                      : "border-base-300 focus:border-primary"
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length <= EXCHANGE_CONTACT_FIELD_MIN_OPTIONS}
                aria-label={`Remove option ${index + 1}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-error/70 hover:bg-error/10 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {errors.options?.message && (
          <p className="mt-1.5 text-xs text-error">{errors.options.message}</p>
        )}
        <button
          type="button"
          onClick={() => append({ label: "" })}
          disabled={fields.length >= EXCHANGE_CONTACT_FIELD_MAX_OPTIONS}
          className="btn mt-2 min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add option
        </button>
      </div>
    </EditSheetShell>
  );
}
