export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  invite: "/invite/:token",
  userDashboard: "/user/dashboard",
  userExchangeContactForms: "/user/apps/exchange-contact-forms",
  userExchangeContactFormBuilder: "/user/apps/exchange-contact-forms/:formId",
  userEmailSignatures: "/user/apps/email-signatures",
  userVirtualBackgrounds: "/user/apps/virtual-backgrounds",
  userBulkMessenger: "/user/apps/bulk-messenger",
  userBulkMessengerSend: "/user/apps/bulk-messenger/sends/:sendId",
  userScanCard: "/user/apps/scan-card",
  orgDashboard: "/org/dashboard",
  adminLogin: "/admin/login",
  adminHome: "/admin",
  adminStaff: "/admin/staff",
  adminProfile: "/admin/profile",
  adminSmartCards: "/admin/smart-cards",
  adminSmartCardsList: "/admin/smart-cards/:templateKey",
  adminRedirects: "/admin/redirects",
  adminEcards: "/admin/e-cards",
  adminCustomerEcards: "/admin/e-cards/:customerId",
  adminEcardBuilder: "/admin/e-cards/:customerId/:ecardId",
  adminCustomerOrganisations: "/admin/customers-organisations",
  adminOrganisationDetail:
    "/admin/customers-organisations/organisations/:organisationId",
  adminOrganisationEcardTemplate:
    "/admin/customers-organisations/organisations/:organisationId/ecard-template",
  adminOrganisationExchangeContactFormTemplate:
    "/admin/customers-organisations/organisations/:organisationId/exchange-contact-form-template",
  adminExchangeContactForms: "/admin/exchange-contact-forms",
  adminCustomerExchangeContactForms: "/admin/exchange-contact-forms/:customerId",
  adminExchangeContactFormBuilder:
    "/admin/exchange-contact-forms/:customerId/:formId",
  adminPlans: "/admin/plans",
  adminBusinessEvents: "/admin/business-events",
  adminEventDetail: "/admin/business-events/:eventId",
  adminProducts: "/admin/products",
  adminProductDetail: "/admin/products/:productId",
  adminOrders: "/admin/orders",
  adminOrderDetail: "/admin/orders/:orderId",
  adminDataMigration: "/admin/data-migration",
  smartCardPublic: "/smartcard/:endpoint",
  ecardPublic: "/ecard/:endpoint",
} as const;

export const LANDING_CONTACT_ANCHOR = `${ROUTES.landing}#contact`;

/** Query param carrying an organisation invite token through /login or
 * /signup when reached via the invite landing page's "Log in"/"Sign up"
 * buttons — see features/organisation-invite. */
export const INVITE_TOKEN_QUERY_PARAM = "invite";

/** Literal `:ecardId` segment used in place of a real id when creating a new
 * e-card — the builder page branches on this to know it's in create mode. */
export const ECARD_NEW_ID = "new";

/** Literal `:formId` segment used in place of a real id when creating a new
 * exchange-contact form — the builder page branches on this to know it's in
 * create mode, mirroring ECARD_NEW_ID above. */
export const EXCHANGE_CONTACT_FORM_NEW_ID = "new";

export function adminSmartCardsListPath(templateKey: string): string {
  return `/admin/smart-cards/${templateKey}`;
}

export function smartCardPublicPath(endpoint: string): string {
  return `/smartcard/${endpoint}`;
}

export function adminCustomerEcardsPath(customerId: string): string {
  return `/admin/e-cards/${customerId}`;
}

export function adminNewEcardPath(customerId: string): string {
  return `/admin/e-cards/${customerId}/${ECARD_NEW_ID}`;
}

export function adminEcardBuilderPath(customerId: string, ecardId: string): string {
  return `/admin/e-cards/${customerId}/${ecardId}`;
}

export function ecardPublicPath(endpoint: string): string {
  return `/ecard/${endpoint}`;
}

export function adminOrganisationDetailPath(organisationId: string): string {
  return `/admin/customers-organisations/organisations/${organisationId}`;
}

export function adminOrganisationEcardTemplatePath(
  organisationId: string,
): string {
  return `/admin/customers-organisations/organisations/${organisationId}/ecard-template`;
}

export function adminOrganisationExchangeContactFormTemplatePath(
  organisationId: string,
): string {
  return `/admin/customers-organisations/organisations/${organisationId}/exchange-contact-form-template`;
}

export function adminCustomerExchangeContactFormsPath(
  customerId: string,
): string {
  return `/admin/exchange-contact-forms/${customerId}`;
}

export function adminNewExchangeContactFormPath(customerId: string): string {
  return `/admin/exchange-contact-forms/${customerId}/${EXCHANGE_CONTACT_FORM_NEW_ID}`;
}

export function adminExchangeContactFormBuilderPath(
  customerId: string,
  formId: string,
): string {
  return `/admin/exchange-contact-forms/${customerId}/${formId}`;
}

export function userNewExchangeContactFormPath(): string {
  return `/user/apps/exchange-contact-forms/${EXCHANGE_CONTACT_FORM_NEW_ID}`;
}

export function userExchangeContactFormBuilderPath(formId: string): string {
  return `/user/apps/exchange-contact-forms/${formId}`;
}

export function userBulkMessengerSendPath(sendId: string): string {
  return `/user/apps/bulk-messenger/sends/${sendId}`;
}

export function adminEventDetailPath(eventId: string): string {
  return `/admin/business-events/${eventId}`;
}

export function adminProductDetailPath(productId: string): string {
  return `/admin/products/${productId}`;
}

export function adminOrderDetailPath(orderId: string): string {
  return `/admin/orders/${orderId}`;
}

export function invitePath(token: string): string {
  return `/invite/${token}`;
}
