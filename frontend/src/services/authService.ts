import { AUTH_ENDPOINTS } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  AuthSession,
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

export function getSession(): Promise<SessionResponse> {
  return apiRequest<SessionResponse>(AUTH_ENDPOINTS.session, {
    method: "GET",
  });
}
