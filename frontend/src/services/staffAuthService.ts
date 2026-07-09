import { STAFF_AUTH_ENDPOINTS } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  StaffAuthSession,
  StaffSessionResponse,
  StaffUser,
  UpdateStaffProfilePayload,
  VerifyStaffOtpPayload,
} from "@app-types/staffAuth";

export function sendSignInOtp(email: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(STAFF_AUTH_ENDPOINTS.sendOtp, {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" }),
  });
}

export function verifySignInOtp(
  payload: VerifyStaffOtpPayload,
): Promise<StaffAuthSession> {
  return apiRequest<StaffAuthSession>(STAFF_AUTH_ENDPOINTS.signIn, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signOutStaff(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(STAFF_AUTH_ENDPOINTS.signOut, {
    method: "POST",
  });
}

export function getStaffSession(): Promise<StaffSessionResponse> {
  return apiRequest<StaffSessionResponse>(STAFF_AUTH_ENDPOINTS.session, {
    method: "GET",
  });
}

export function updateStaffProfile(
  payload: UpdateStaffProfilePayload,
): Promise<{ user: StaffUser }> {
  return apiRequest<{ user: StaffUser }>(STAFF_AUTH_ENDPOINTS.updateProfile, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
