export const AUTH_BASE_PATH = "/api/auth/customers";

export const AUTH_ENDPOINTS = {
  signUp: `${AUTH_BASE_PATH}/sign-up/email`,
  signIn: `${AUTH_BASE_PATH}/sign-in/email`,
  signOut: `${AUTH_BASE_PATH}/sign-out`,
  session: `${AUTH_BASE_PATH}/get-session`,
} as const;

export const STAFF_AUTH_BASE_PATH = "/api/auth/staff";

export const STAFF_AUTH_ENDPOINTS = {
  sendOtp: `${STAFF_AUTH_BASE_PATH}/email-otp/send-verification-otp`,
  signIn: `${STAFF_AUTH_BASE_PATH}/sign-in/email-otp`,
  signOut: `${STAFF_AUTH_BASE_PATH}/sign-out`,
  session: `${STAFF_AUTH_BASE_PATH}/get-session`,
  updateProfile: `${STAFF_AUTH_BASE_PATH}/update-user`,
} as const;

export const STAFF_MANAGEMENT_BASE_PATH = "/api/staff";

export const SMART_CARDS_BASE_PATH = "/api/smart-cards";

export const PUBLIC_SMART_CARDS_BASE_PATH = "/api/public/smart-cards";

export const CUSTOMERS_BASE_PATH = "/api/customers";

export const REDIRECTS_BASE_PATH = "/api/redirects";

export const EMPLOYEE_ECARDS_BASE_PATH = "/api/employee/ecards";

export const PUBLIC_ECARDS_BASE_PATH = "/api/public/ecards";

export const EMPLOYEE_ORGANISATIONS_BASE_PATH = "/api/employee/organisations";

export const EMPLOYEE_PLANS_BASE_PATH = "/api/employee/plans";

export const EMPLOYEE_CUSTOMER_PLAN_BASE_PATH = "/api/employee/customers";

export const CUSTOMER_PLAN_BASE_PATH = "/api/customer/plan";

export const SMART_CARD_TEMPLATES_BASE_PATH = "/api/smart-card-templates";

export const EMPLOYEE_BUSINESS_EVENTS_BASE_PATH =
  "/api/employee/business-events";
