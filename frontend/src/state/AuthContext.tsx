import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { api, ApiError } from "../lib/api";
import type { User } from "../lib/types";

type AuthValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (payload: {
    email: string; password: string; display_name: string; locale: string;
    monthly_income?: string | null; load_demo_data?: boolean;
  }) => Promise<User>;
  demo: () => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status === 401) setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onUnauthorized = () => setUser(null);
    window.addEventListener("mt:unauthorized", onUnauthorized);
    return () => window.removeEventListener("mt:unauthorized", onUnauthorized);
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: User }>("/api/auth/login", { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback<AuthValue["signUp"]>(async (payload) => {
    const data = await api.post<{ user: User }>("/api/auth/register", payload);
    setUser(data.user);
    return data.user;
  }, []);

  const demo = useCallback(async () => {
    const data = await api.post<{ user: User }>("/api/auth/demo");
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, signIn, signUp, demo, signOut, refresh, setUser }),
    [user, loading, signIn, signUp, demo, signOut, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
