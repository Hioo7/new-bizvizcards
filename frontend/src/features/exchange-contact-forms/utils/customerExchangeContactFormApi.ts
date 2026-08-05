import { listCustomerEcards } from "@services/customerEcardService";
import {
  createMyExchangeContactForm,
  deleteMyExchangeContactForm,
  deleteMyExchangeContactFormVersion,
  getMyExchangeContactForm,
  listMyExchangeContactForms,
  listMyExchangeContactFormVersions,
  setMyExchangeContactFormLinkedEcards,
  updateMyExchangeContactForm,
} from "@services/customerExchangeContactFormService";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";

// No per-caller binding needed — the server infers "which customer" from the
// authenticated session, never from a client-supplied id — so this is a
// stable module-level constant, same convention as
// ADMIN_ORGANISATION_EXCHANGE_CONTACT_FORM_TEMPLATE_API.
export const CUSTOMER_EXCHANGE_CONTACT_FORM_API: ExchangeContactFormApi = {
  list: listMyExchangeContactForms,
  get: getMyExchangeContactForm,
  create: createMyExchangeContactForm,
  update: updateMyExchangeContactForm,
  deleteForm: deleteMyExchangeContactForm,
  listVersions: listMyExchangeContactFormVersions,
  deleteVersion: deleteMyExchangeContactFormVersion,
  setLinkedEcards: setMyExchangeContactFormLinkedEcards,
  listLinkableEcards: listCustomerEcards,
};
