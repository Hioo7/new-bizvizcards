export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  userDashboard: "/user/dashboard",
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

/** Literal `:ecardId` segment used in place of a real id when creating a new
 * e-card — the builder page branches on this to know it's in create mode. */
export const ECARD_NEW_ID = "new";

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

export function adminEventDetailPath(eventId: string): string {
  return `/admin/business-events/${eventId}`;
}

export function adminProductDetailPath(productId: string): string {
  return `/admin/products/${productId}`;
}

export function adminOrderDetailPath(orderId: string): string {
  return `/admin/orders/${orderId}`;
}
