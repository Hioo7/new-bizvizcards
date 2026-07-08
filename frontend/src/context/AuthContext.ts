import { createContext } from "react";
import type { AuthUser, SignInPayload, SignUpPayload } from "@app-types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signUp: (payload: SignUpPayload) => Promise<AuthUser>;
  signIn: (payload: SignInPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
