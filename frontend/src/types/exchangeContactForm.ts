export type ExchangeContactFieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "PHONE"
  | "EMAIL"
  | "LOCATION"
  | "MULTIPLE_CHOICE"
  | "DROPDOWN"
  | "DATE"
  | "BREAK";

export type ExchangeContactFieldTag =
  | "LEAD_NAME"
  | "LEAD_EMAIL"
  | "LEAD_PHONE"
  | "LEAD_NOTE"
  | "LEAD_LOCATION"
  | "LEAD_COMPANY"
  | "LEAD_PROFESSION";

export interface ExchangeContactFormFieldOption {
  id: string;
  label: string;
  order: number;
}

export interface ExchangeContactFormField {
  id: string;
  order: number;
  type: ExchangeContactFieldType;
  tag: ExchangeContactFieldTag | null;
  label: string;
  helpText: string | null;
  isRequired: boolean;
  options: ExchangeContactFormFieldOption[];
}

export interface ExchangeContactFormVersion {
  id: string;
  versionNumber: number;
  fields: ExchangeContactFormField[];
}

export interface ExchangeContactForm {
  id: string;
  customerId: string | null;
  organisationId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
  linkedEcardIds: string[];
  currentVersion: ExchangeContactFormVersion;
}

export interface ExchangeContactFormVersionSummary {
  id: string;
  versionNumber: number;
  isCurrent: boolean;
  submissionCount: number;
  createdAt: string;
}

export interface UpdateExchangeContactFormResult {
  form: ExchangeContactForm;
  forked: boolean;
}

// ── Wire payload shapes (mirror the backend's Zod-inferred DTOs) ──────────

interface ExchangeContactFormFieldOptionPayload {
  label: string;
}

interface ExchangeContactFormFieldPayloadBase {
  label: string;
  helpText?: string;
  isRequired: boolean;
}

export type ExchangeContactFormFieldPayload =
  | (ExchangeContactFormFieldPayloadBase & {
      type: "SHORT_TEXT";
      tag?: "LEAD_NAME" | "LEAD_COMPANY" | "LEAD_PROFESSION";
    })
  | (ExchangeContactFormFieldPayloadBase & { type: "LONG_TEXT"; tag: "LEAD_NOTE" })
  | (ExchangeContactFormFieldPayloadBase & { type: "PHONE"; tag: "LEAD_PHONE" })
  | (ExchangeContactFormFieldPayloadBase & { type: "EMAIL"; tag: "LEAD_EMAIL" })
  | (ExchangeContactFormFieldPayloadBase & {
      type: "LOCATION";
      tag: "LEAD_LOCATION";
    })
  | (ExchangeContactFormFieldPayloadBase & {
      type: "MULTIPLE_CHOICE";
      options: ExchangeContactFormFieldOptionPayload[];
    })
  | (ExchangeContactFormFieldPayloadBase & {
      type: "DROPDOWN";
      options: ExchangeContactFormFieldOptionPayload[];
    })
  | (ExchangeContactFormFieldPayloadBase & { type: "DATE" })
  // A structural marker, not a question — no label/helpText/isRequired.
  | { type: "BREAK" };

export interface CreateExchangeContactFormPayload {
  customerId: string;
  name: string;
  fields: ExchangeContactFormFieldPayload[];
}

export interface UpdateExchangeContactFormPayload {
  name?: string;
  fields: ExchangeContactFormFieldPayload[];
}

export interface UpsertOrganisationExchangeContactFormTemplatePayload {
  name: string;
  fields: ExchangeContactFormFieldPayload[];
}

// ── Public resolution + submission shapes ──────────────────────────────────

export interface PublicExchangeContactFormFieldOption {
  id: string;
  label: string;
}

export interface PublicExchangeContactFormField {
  id: string;
  order: number;
  type: ExchangeContactFieldType;
  tag: ExchangeContactFieldTag | null;
  label: string;
  helpText: string | null;
  isRequired: boolean;
  options: PublicExchangeContactFormFieldOption[];
}

export interface PublicExchangeContactForm {
  id: string;
  versionId: string;
  fields: PublicExchangeContactFormField[];
}

interface ExchangeContactFormAnswerPayloadBase {
  fieldId: string;
}

export type ExchangeContactFormAnswerPayload =
  | (ExchangeContactFormAnswerPayloadBase & { type: "SHORT_TEXT"; value: string })
  | (ExchangeContactFormAnswerPayloadBase & { type: "LONG_TEXT"; value: string })
  | (ExchangeContactFormAnswerPayloadBase & { type: "EMAIL"; value: string })
  | (ExchangeContactFormAnswerPayloadBase & {
      type: "PHONE";
      countryDialCode: string;
      phoneNumber: string;
    })
  | (ExchangeContactFormAnswerPayloadBase & {
      type: "LOCATION";
      latitude: number;
      longitude: number;
    })
  | (ExchangeContactFormAnswerPayloadBase & {
      type: "MULTIPLE_CHOICE";
      optionId: string;
    })
  | (ExchangeContactFormAnswerPayloadBase & { type: "DROPDOWN"; optionId: string })
  | (ExchangeContactFormAnswerPayloadBase & { type: "DATE"; value: string });

export interface SubmitCustomFormExchangeContactPayload {
  formVersionId: string;
  answers: ExchangeContactFormAnswerPayload[];
  // Attribution carried over from the landing URL's `?src=&sref=` params.
  trafficSource?: string;
  trafficSourceRefId?: string;
}
