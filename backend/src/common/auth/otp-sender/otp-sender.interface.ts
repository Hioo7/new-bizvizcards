export type OtpType =
  'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

export interface OtpSendParams {
  email: string;
  otp: string;
  type: OtpType;
}

export interface OtpSender {
  send(params: OtpSendParams): Promise<void>;
}
