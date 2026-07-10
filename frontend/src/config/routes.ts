export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  adminLogin: "/admin/login",
  adminHome: "/admin",
  adminStaff: "/admin/staff",
  adminProfile: "/admin/profile",
  adminSmartCards: "/admin/smart-cards",
  adminSmartCardsList: "/admin/smart-cards/:templateKey",
  adminRedirects: "/admin/redirects",
  smartCardPublic: "/smartcard/:endpoint",
} as const;

export const LANDING_CONTACT_ANCHOR = `${ROUTES.landing}#contact`;

export function adminSmartCardsListPath(templateKey: string): string {
  return `/admin/smart-cards/${templateKey}`;
}

export function smartCardPublicPath(endpoint: string): string {
  return `/smartcard/${endpoint}`;
}
