import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStaffSession,
  signOutStaff,
  verifySignInOtp,
} from "@services/staffAuthService";
import type { StaffUser, VerifyStaffOtpPayload } from "@app-types/staffAuth";
import { StaffAuthContext } from "@context/StaffAuthContext";

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const session = await getStaffSession();
      setStaffUser(session.user);
    } catch {
      setStaffUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getStaffSession()
      .then((session) => {
        if (!cancelled) setStaffUser(session.user);
      })
      .catch(() => {
        if (!cancelled) setStaffUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (payload: VerifyStaffOtpPayload) => {
    const session = await verifySignInOtp(payload);
    setStaffUser(session.user);
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    await signOutStaff();
    setStaffUser(null);
  }, []);

  const value = useMemo(
    () => ({
      staffUser,
      isLoading,
      signIn,
      signOut,
      refreshStaffUser: loadSession,
    }),
    [staffUser, isLoading, signIn, signOut, loadSession],
  );

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
}
