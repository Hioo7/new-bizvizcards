export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  adminLogin: "/admin/login",
  adminHome: "/admin",
  adminStaff: "/admin/staff",
  adminProfile: "/admin/profile",
} as const;

export const LANDING_CONTACT_ANCHOR = `${ROUTES.landing}#contact`;
