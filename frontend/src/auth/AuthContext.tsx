import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import * as cognito from "./cognito";

interface AuthState {
  loading: boolean;
  session: CognitoUserSession | null;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CognitoUserSession | null>(null);

  useEffect(() => {
    cognito
      .getSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      email: session?.getIdToken().payload.email as string | undefined ?? null,
      signIn: async (email, password) => {
        const next = await cognito.signIn(email, password);
        setSession(next);
      },
      signOut: () => {
        cognito.signOut();
        setSession(null);
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
