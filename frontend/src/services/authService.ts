import { AUTH_ENDPOINTS, CUSTOMER_ENDPOINTS } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  AuthSession,
  AuthUser,
  SessionResponse,
  SignInPayload,
  SignUpPayload,
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
