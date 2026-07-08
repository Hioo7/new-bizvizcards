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
} as const;
