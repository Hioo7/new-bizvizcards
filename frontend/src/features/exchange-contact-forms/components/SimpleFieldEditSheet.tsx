import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import EditSheetShell from "@components/EditSheetShell";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import {
  simpleFieldSheetSchema,
  type SimpleFieldSheetValues,
} from "@features/exchange-contact-forms/schemas/exchangeContactFormFieldSchemas";
import {
  CORE_FIELD_CATALOG,
  CORE_TAG_ICON,
  FIELD_TYPE_ICON,
  FIELD_TYPE_LABEL,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import type {
  DateFieldDraft,
  EmailFieldDraft,
  LocationFieldDraft,
  LongTextFieldDraft,
  PhoneFieldDraft,
  ShortTextFieldDraft,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";

type SimpleDraft =
  | ShortTextFieldDraft
  | LongTextFieldDraft
  | PhoneFieldDraft
  | EmailFieldDraft
  | LocationFieldDraft
  | DateFieldDraft;

interface SimpleFieldEditSheetProps {
  open: boolean;
  draft: SimpleDraft;
  onClose: () => void;
  onSave: (draft: SimpleDraft) => void;
}

export default function SimpleFieldEditSheet({
  open,
  draft,
  onClose,
  onSave,
}: SimpleFieldEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SimpleFieldSheetValues>({
    resolver: zodResolver(simpleFieldSheetSchema),
    defaultValues: {
      label: draft.label,
      helpText: draft.helpText,
      isRequired: draft.isRequired,
    },
  });

  const isNameField = draft.tag === "LEAD_NAME";
  const catalogEntry = draft.tag
    ? CORE_FIELD_CATALOG.find((entry) => entry.tag === draft.tag)
    : undefined;
  const Icon = (draft.tag && CORE_TAG_ICON[draft.tag]) || FIELD_TYPE_ICON[draft.type];
  const title = catalogEntry ? catalogEntry.label : FIELD_TYPE_LABEL[draft.type];

  function submit(values: SimpleFieldSheetValues) {
    onSave({
      ...draft,
      label: values.label,
      helpText: values.helpText,
      isRequired: isNameField ? true : values.isRequired,
    });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Icon}
      title={title}
      subtitle={catalogEntry?.description}
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
        <span className="text-sm font-medium text-base-content">
          Required
        </span>
        {isNameField ? (
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked
            disabled
            readOnly
          />
        ) : (
          <input
            type="checkbox"
            className="toggle toggle-primary"
            {...register("isRequired")}
          />
        )}
      </label>
      {isNameField && (
        <p className="text-xs text-base-content/50">
          The Name field is always required — every form must be able to
          capture the visitor&rsquo;s name.
        </p>
      )}
    </EditSheetShell>
  );
}
