import { OtpType } from './otp-sender.interface';

export const OTP_EMAIL_SUBJECTS: Record<OtpType, string> = {
  'sign-in': 'Your sign-in verification code',
  'email-verification': 'Verify your email address',
  'forget-password': 'Reset your password',
  'change-email': 'Verify your new email address',
};
