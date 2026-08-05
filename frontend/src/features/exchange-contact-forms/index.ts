export { default as ExchangeContactFormCustomerPickerView } from "@features/exchange-contact-forms/components/ExchangeContactFormCustomerPickerView";
export { default as ExchangeContactFormListView } from "@features/exchange-contact-forms/components/ExchangeContactFormListView";
export { default as ExchangeContactFormBuilderView } from "@features/exchange-contact-forms/components/ExchangeContactFormBuilderView";
export type { ExchangeContactFormListViewProps } from "@features/exchange-contact-forms/components/ExchangeContactFormListView";
export type { ExchangeContactFormBuilderViewProps } from "@features/exchange-contact-forms/components/ExchangeContactFormBuilderView";

// Shared building blocks — also consumed by the organisation-level template
// builder (features/organisation-exchange-contact-form-template).
export { default as FieldListEditor } from "@features/exchange-contact-forms/components/FieldListEditor";

// api-prop implementations — the admin one binds the employee-facing
// endpoints to one specific customer (factory, needs a customerId); the
// customer one needs no binding at all (the server infers "me" from the
// session), so it's a stable constant.
export { createAdminExchangeContactFormApi } from "@features/exchange-contact-forms/utils/createAdminExchangeContactFormApi";
export { CUSTOMER_EXCHANGE_CONTACT_FORM_API } from "@features/exchange-contact-forms/utils/customerExchangeContactFormApi";

// Types
export type {
  BuilderField,
  FieldDraft,
  ExchangeContactFormBuilderState,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";
export {
  emptyExchangeContactFormBuilderState,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";
export type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";

// Mapping helpers — reused by the organisation template builder, whose
// field drafts/payloads share the exact same shape as a customer form's own.
export {
  buildExchangeContactFormFieldsPayload,
  formToBuilderState,
} from "@features/exchange-contact-forms/utils/exchangeContactFormMapping";

// Config
export {
  EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
