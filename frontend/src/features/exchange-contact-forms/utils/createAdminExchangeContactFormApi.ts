import { listEcards } from "@services/ecardService";
import {
  createExchangeContactForm,
  deleteExchangeContactForm,
  deleteExchangeContactFormVersion,
  getExchangeContactForm,
  listExchangeContactForms,
  listExchangeContactFormVersions,
  setExchangeContactFormLinkedEcards,
  updateExchangeContactForm,
} from "@services/exchangeContactFormService";
import { ECARD_LIST_PAGE_SIZE } from "@config/ecardList.config";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";

// Binds the employee-facing exchange-contact-form endpoints to one specific
// customer, so ExchangeContactFormListView/BuilderView (and their shared
// children) stay unaware they're being driven by staff acting on someone
// else's behalf — mirrors how the admin org e-card template page binds its
// own OrganisationEcardTemplateBuilderApi to a specific organisationId.
export function createAdminExchangeContactFormApi(
  customerId: string,
): ExchangeContactFormApi {
  return {
    list: () => listExchangeContactForms(customerId),
    get: getExchangeContactForm,
    create: (payload) =>
      createExchangeContactForm({ ...payload, customerId }),
    update: updateExchangeContactForm,
    deleteForm: deleteExchangeContactForm,
    listVersions: listExchangeContactFormVersions,
    deleteVersion: deleteExchangeContactFormVersion,
    setLinkedEcards: setExchangeContactFormLinkedEcards,
    listLinkableEcards: () =>
      listEcards({ customerId, page: 1, pageSize: ECARD_LIST_PAGE_SIZE }).then(
        (response) => response.ecards,
      ),
  };
}
