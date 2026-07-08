export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;
export const OTP_EXPIRY_MINUTES = 5;

export const GENERIC_SEND_OTP_ERROR_MESSAGE =
  "Failed to send code. Please try again.";
export const GENERIC_VERIFY_OTP_ERROR_MESSAGE =
  "Invalid or expired code. Please try again.";
export const INCOMPLETE_OTP_MESSAGE = `Please enter the full ${OTP_LENGTH}-digit code.`;
