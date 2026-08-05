import type { Ecard } from "@app-types/ecard";
import type {
  ExchangeContactForm,
  ExchangeContactFormFieldPayload,
  ExchangeContactFormVersionSummary,
  UpdateExchangeContactFormPayload,
  UpdateExchangeContactFormResult,
} from "@app-types/exchangeContactForm";

// Injected by the caller (admin page vs. customer's own "my forms" mini-app)
// so the list/builder views and their shared children (FormVersionHistoryPanel,
// LinkedEcardsPicker) stay agnostic of which auth scope (employee vs.
// customer) the underlying HTTP calls run under — mirrors
// OrganisationEcardTemplateBuilderApi's exact "inject a bound api object"
// pattern. `create`'s payload omits customerId: the admin implementation
// closes over a specific customerId, the customer implementation needs none
// at all (the server infers it from the session).
export interface ExchangeContactFormApi {
  list: () => Promise<ExchangeContactForm[]>;
  get: (formId: string) => Promise<ExchangeContactForm>;
  create: (payload: {
    name: string;
    fields: ExchangeContactFormFieldPayload[];
  }) => Promise<ExchangeContactForm>;
  update: (
    formId: string,
    payload: UpdateExchangeContactFormPayload,
  ) => Promise<UpdateExchangeContactFormResult>;
  deleteForm: (formId: string) => Promise<void>;
  listVersions: (formId: string) => Promise<ExchangeContactFormVersionSummary[]>;
  deleteVersion: (formId: string, versionId: string) => Promise<void>;
  setLinkedEcards: (formId: string, ecardIds: string[]) => Promise<void>;
  listLinkableEcards: () => Promise<Ecard[]>;
}
