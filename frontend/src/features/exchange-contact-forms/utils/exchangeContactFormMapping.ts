import type {
  ExchangeContactForm,
  ExchangeContactFormField,
  ExchangeContactFormFieldPayload,
} from "@app-types/exchangeContactForm";
import type {
  BuilderField,
  ExchangeContactFormBuilderState,
  FieldDraft,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";

export function draftToFieldPayload(
  draft: FieldDraft,
): ExchangeContactFormFieldPayload {
  if (draft.type === "BREAK") {
    return { type: "BREAK" };
  }
  const base = {
    label: draft.label.trim(),
    helpText: draft.helpText.trim() || undefined,
    isRequired: draft.isRequired,
  };
  switch (draft.type) {
    case "SHORT_TEXT":
      return { ...base, type: "SHORT_TEXT", tag: draft.tag ?? undefined };
    case "LONG_TEXT":
      return { ...base, type: "LONG_TEXT", tag: draft.tag };
    case "PHONE":
      return { ...base, type: "PHONE", tag: draft.tag };
    case "EMAIL":
      return { ...base, type: "EMAIL", tag: draft.tag };
    case "LOCATION":
      return { ...base, type: "LOCATION", tag: draft.tag };
    case "MULTIPLE_CHOICE":
      return {
        ...base,
        type: "MULTIPLE_CHOICE",
        options: draft.options.map((option) => ({ label: option.label.trim() })),
      };
    case "DROPDOWN":
      return {
        ...base,
        type: "DROPDOWN",
        options: draft.options.map((option) => ({ label: option.label.trim() })),
      };
    case "DATE":
      return { ...base, type: "DATE" };
  }
}

export function buildExchangeContactFormFieldsPayload(
  fields: BuilderField[],
): ExchangeContactFormFieldPayload[] {
  return fields.map((field) => draftToFieldPayload(field.draft));
}

export function fieldToDraft(field: ExchangeContactFormField): FieldDraft {
  if (field.type === "BREAK") {
    return { type: "BREAK", tag: null };
  }
  const base = {
    label: field.label,
    helpText: field.helpText ?? "",
    isRequired: field.isRequired,
  };
  switch (field.type) {
    case "SHORT_TEXT":
      return {
        ...base,
        type: "SHORT_TEXT",
        tag: field.tag as "LEAD_NAME" | "LEAD_COMPANY" | "LEAD_PROFESSION" | null,
      };
    case "LONG_TEXT":
      return { ...base, type: "LONG_TEXT", tag: "LEAD_NOTE" };
    case "PHONE":
      return { ...base, type: "PHONE", tag: "LEAD_PHONE" };
    case "EMAIL":
      return { ...base, type: "EMAIL", tag: "LEAD_EMAIL" };
    case "LOCATION":
      return { ...base, type: "LOCATION", tag: "LEAD_LOCATION" };
    case "MULTIPLE_CHOICE":
      return {
        ...base,
        type: "MULTIPLE_CHOICE",
        tag: null,
        options: field.options.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      };
    case "DROPDOWN":
      return {
        ...base,
        type: "DROPDOWN",
        tag: null,
        options: field.options.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      };
    case "DATE":
      return { ...base, type: "DATE", tag: null };
  }
}

export function formToBuilderState(
  form: ExchangeContactForm,
): ExchangeContactFormBuilderState {
  return {
    name: form.name,
    fields: form.currentVersion.fields.map((field) => ({
      key: field.id,
      draft: fieldToDraft(field),
    })),
  };
}
