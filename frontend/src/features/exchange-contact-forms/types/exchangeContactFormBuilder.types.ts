import type {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
} from "@app-types/exchangeContactForm";

export interface FieldOptionDraft {
  /** Present only for an option that already exists on the server (used to
   * detect which submitted-answer's selectedOptionId it corresponds to
   * elsewhere) — a freshly added option has no id yet. */
  id?: string;
  label: string;
}

interface FieldDraftBase {
  label: string;
  helpText: string;
  isRequired: boolean;
}

export interface ShortTextFieldDraft extends FieldDraftBase {
  type: "SHORT_TEXT";
  tag: "LEAD_NAME" | "LEAD_COMPANY" | "LEAD_PROFESSION" | null;
}

export interface LongTextFieldDraft extends FieldDraftBase {
  type: "LONG_TEXT";
  tag: "LEAD_NOTE";
}

export interface PhoneFieldDraft extends FieldDraftBase {
  type: "PHONE";
  tag: "LEAD_PHONE";
}

export interface EmailFieldDraft extends FieldDraftBase {
  type: "EMAIL";
  tag: "LEAD_EMAIL";
}

export interface LocationFieldDraft extends FieldDraftBase {
  type: "LOCATION";
  tag: "LEAD_LOCATION";
}

export interface MultipleChoiceFieldDraft extends FieldDraftBase {
  type: "MULTIPLE_CHOICE";
  tag: null;
  options: FieldOptionDraft[];
}

export interface DropdownFieldDraft extends FieldDraftBase {
  type: "DROPDOWN";
  tag: null;
  options: FieldOptionDraft[];
}

export interface DateFieldDraft extends FieldDraftBase {
  type: "DATE";
  tag: null;
}

/** A structural marker, not a question — deliberately doesn't extend
 * FieldDraftBase (no label/helpText/isRequired to edit). */
export interface BreakFieldDraft {
  type: "BREAK";
  tag: null;
}

export type FieldDraft =
  | ShortTextFieldDraft
  | LongTextFieldDraft
  | PhoneFieldDraft
  | EmailFieldDraft
  | LocationFieldDraft
  | MultipleChoiceFieldDraft
  | DropdownFieldDraft
  | DateFieldDraft
  | BreakFieldDraft;

/** `key` is a stable local id for dnd-kit + React list keys — independent of
 * the server-assigned field id, which doesn't exist yet for freshly added
 * fields (mirrors BuilderComponent in the e-card builder). */
export interface BuilderField {
  key: string;
  draft: FieldDraft;
}

export function emptyNameFieldDraft(): ShortTextFieldDraft {
  return { type: "SHORT_TEXT", tag: "LEAD_NAME", label: "Name", helpText: "", isRequired: true };
}

export function emptyDraftForCoreTag(
  tag: Exclude<ExchangeContactFieldTag, "LEAD_NAME">,
  type: ExchangeContactFieldType,
  label: string,
): FieldDraft {
  const base = { label, helpText: "", isRequired: false };
  switch (type) {
    case "LONG_TEXT":
      return { ...base, type: "LONG_TEXT", tag: "LEAD_NOTE" };
    case "PHONE":
      return { ...base, type: "PHONE", tag: "LEAD_PHONE" };
    case "EMAIL":
      return { ...base, type: "EMAIL", tag: "LEAD_EMAIL" };
    case "LOCATION":
      return { ...base, type: "LOCATION", tag: "LEAD_LOCATION" };
    case "SHORT_TEXT":
      return {
        ...base,
        type: "SHORT_TEXT",
        tag: tag as "LEAD_COMPANY" | "LEAD_PROFESSION",
      };
    default:
      throw new Error(`Core tag ${tag} has no supported field type ${type}`);
  }
}

export function emptyDraftForCustomQuestionType(
  type: "SHORT_TEXT" | "MULTIPLE_CHOICE" | "DROPDOWN" | "DATE" | "BREAK",
): FieldDraft {
  const base = { label: "", helpText: "", isRequired: false };
  switch (type) {
    case "SHORT_TEXT":
      return { ...base, type: "SHORT_TEXT", tag: null };
    case "MULTIPLE_CHOICE":
      return {
        ...base,
        type: "MULTIPLE_CHOICE",
        tag: null,
        options: [{ label: "" }, { label: "" }],
      };
    case "DROPDOWN":
      return {
        ...base,
        type: "DROPDOWN",
        tag: null,
        options: [{ label: "" }, { label: "" }],
      };
    case "DATE":
      return { ...base, type: "DATE", tag: null };
    case "BREAK":
      return { type: "BREAK", tag: null };
  }
}

export interface ExchangeContactFormBuilderState {
  name: string;
  fields: BuilderField[];
}

export function emptyExchangeContactFormBuilderState(): ExchangeContactFormBuilderState {
  return {
    name: "",
    fields: [{ key: crypto.randomUUID(), draft: emptyNameFieldDraft() }],
  };
}
