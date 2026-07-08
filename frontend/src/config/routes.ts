export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  adminLogin: "/admin/login",
  adminHome: "/admin",
} as const;

export const LANDING_CONTACT_ANCHOR = `${ROUTES.landing}#contact`;
