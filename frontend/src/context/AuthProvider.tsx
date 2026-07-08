import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getSession,
  signInEmail,
  signOut as signOutRequest,
  signUpEmail,
} from "@services/authService";
import type { AuthUser, SignInPayload, SignUpPayload } from "@app-types/auth";
import { AuthContext } from "@context/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((session) => {
        if (!cancelled) setUser(session.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const session = await signUpEmail(payload);
    setUser(session.user);
    return session.user;
  }, []);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const session = await signInEmail(payload);
    setUser(session.user);
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signUp, signIn, signOut }),
    [user, isLoading, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
