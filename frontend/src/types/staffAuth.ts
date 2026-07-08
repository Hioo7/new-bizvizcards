export type StaffRole = "employee" | "admin" | "super_admin";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: StaffRole | null;
  emailVerified: boolean;
  banned: boolean | null;
}

export interface StaffAuthSession {
  token: string;
  user: StaffUser;
}

export type StaffOtpType = "sign-in";

export interface SendStaffOtpPayload {
  email: string;
  type: StaffOtpType;
}

export interface VerifyStaffOtpPayload {
  email: string;
  otp: string;
}

export interface StaffSessionResponse {
  session: { token: string } | null;
  user: StaffUser | null;
}
