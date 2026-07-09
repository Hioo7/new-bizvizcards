import { createContext } from "react";
import type { StaffUser, VerifyStaffOtpPayload } from "@app-types/staffAuth";

export interface StaffAuthContextValue {
  staffUser: StaffUser | null;
  isLoading: boolean;
  signIn: (payload: VerifyStaffOtpPayload) => Promise<StaffUser>;
  signOut: () => Promise<void>;
  refreshStaffUser: () => Promise<void>;
}

export const StaffAuthContext = createContext<StaffAuthContextValue | undefined>(
  undefined,
);
