export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  pfpUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SessionResponse {
  session: { token: string } | null;
  user: AuthUser | null;
}

export type SocialProvider = "google" | "apple";

export interface SocialSignInResponse {
  url: string;
  redirect: boolean;
}
