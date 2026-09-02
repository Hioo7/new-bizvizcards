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

// GET /oauth2/public-client — better-auth's OAuth-provider client metadata,
// snake_case per RFC 7591 (distinct casing from OAuthConsent below, which is
// better-auth's own internal consent-record shape).
export interface OAuthPublicClient {
  client_id: string;
  client_name: string;
  logo_uri?: string;
  contacts: string[];
  redirect_uris: string[];
}

// GET /oauth2/get-consents — one row per app the customer has granted
// access to. Carries the client's id but not its display name/logo — pair
// with a GET /oauth2/public-client call per clientId to show one (see
// features/connected-apps).
export interface OAuthConsent {
  id: string;
  clientId: string;
  userId: string | null;
  resources: string[];
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}
