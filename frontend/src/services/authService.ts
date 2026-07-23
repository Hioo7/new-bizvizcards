import { AUTH_ENDPOINTS, CUSTOMER_ENDPOINTS } from "@config/api";
import { ROUTES } from "@config/routes";
import { apiRequest } from "@services/apiClient";
import type {
  AuthSession,
  AuthUser,
  CustomerProfile,
  SessionResponse,
  SignInPayload,
  SignUpPayload,
  SocialProvider,
  SocialSignInResponse,
} from "@app-types/auth";

export function signUpEmail(payload: SignUpPayload): Promise<AuthSession> {
  return apiRequest<AuthSession>(AUTH_ENDPOINTS.signUp, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signInEmail(payload: SignInPayload): Promise<AuthSession> {
  return apiRequest<AuthSession>(AUTH_ENDPOINTS.signIn, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Better Auth's sign-in/social returns a provider URL rather than actually
// redirecting the fetch itself (it sets a Location header, but that's inert
// for a same-origin XHR/fetch call) — the caller hands the browser off to it.
export async function signInSocial(provider: SocialProvider): Promise<void> {
  const { url } = await apiRequest<SocialSignInResponse>(
    AUTH_ENDPOINTS.signInSocial,
    {
      method: "POST",
      body: JSON.stringify({
        provider,
        callbackURL: `${window.location.origin}${ROUTES.userDashboard}`,
      }),
    },
  );
  window.location.href = url;
}

export function signOut(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(AUTH_ENDPOINTS.signOut, {
    method: "POST",
  });
}

export function getSession(): Promise<SessionResponse | null> {
  return apiRequest<SessionResponse | null>(AUTH_ENDPOINTS.session, {
    method: "GET",
  });
}

export function updateUserName(name: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>(AUTH_ENDPOINTS.updateUser, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateUserImage(image: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>(AUTH_ENDPOINTS.updateUser, {
    method: "POST",
    body: JSON.stringify({ image }),
  });
}

export function getCustomerProfile(): Promise<CustomerProfile> {
  return apiRequest<CustomerProfile>(CUSTOMER_ENDPOINTS.me, { method: "GET" });
}

export function updateCustomerPhone(payload: {
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}): Promise<CustomerProfile> {
  return apiRequest<CustomerProfile>(CUSTOMER_ENDPOINTS.updatePhone, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateProfilePicture(
  file: File,
): Promise<{ pfpMediaId: string | null; pfpUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<{ pfpMediaId: string | null; pfpUrl: string }>(
    CUSTOMER_ENDPOINTS.updateProfilePicture,
    { method: "PATCH", body: formData },
  );
}
