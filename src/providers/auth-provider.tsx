import { useQueryClient } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, use, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { restoreFailureAction } from "@/lib/auth-restore";
import { errorText } from "@/lib/format";
import { googleAndStartSession, parseAppSession, registerAndStartSession, type AppSession } from "@/lib/registration-session";
import { tokenStorage } from "@/lib/token-storage";
import type { User } from "@/types/api";

type AuthStatus = "loading" | "error" | "anonymous" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  startupError: string | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (values: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  retryRestore: () => void;
  updateUser: (values: Pick<User, "name" | "avatar">) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.setUnauthorizedHandler(async (rejectedToken) => {
      if (await tokenStorage.getToken() !== rejectedToken) return;
      setUser(null);
      setStartupError(null);
      setStatus("anonymous");
      queryClient.clear();
      await tokenStorage.clearToken();
    });
    return () => api.setUnauthorizedHandler(null);
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    async function restore() {
      setStatus("loading");
      setStartupError(null);
      const token = await tokenStorage.getToken();
      if (!token) {
        if (active) setStatus("anonymous");
        return;
      }
      try {
        const me = await api.request<User>("/users/me");
        if (active) {
          setUser(me);
          queryClient.setQueryData(["me"], me);
          setStatus("authenticated");
        }
      } catch (error) {
        if (restoreFailureAction(error) === "sign-out") {
          await tokenStorage.clearToken();
          if (active) setStatus("anonymous");
        } else if (active) {
          setStartupError(errorText(error));
          setStatus("error");
        }
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, [queryClient, restoreAttempt]);

  const finishSession = async (session: AppSession) => {
    await tokenStorage.setToken(session.access_token);
    try {
      const me = session.user ?? await api.request<User>("/users/me");
      setUser(me);
      queryClient.setQueryData(["me"], me);
      setStatus("authenticated");
    } catch (error) {
      await tokenStorage.clearToken();
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const response = await api.request("/auth/login", {
      method: "POST",
      body: { email, password },
      authenticated: false,
    });
    await finishSession(parseAppSession(response));
  };

  const loginWithGoogle = async (idToken: string) => {
    await googleAndStartSession({
      exchange: (body) => api.request("/auth/google", {
        method: "POST",
        body,
        authenticated: false,
      }),
      startSession: finishSession,
    }, idToken);
  };

  const registerWithEmail = async (values: { email: string; password: string; name: string }) => {
    await registerAndStartSession({
      register: (body) => api.request("/auth/register", {
        method: "POST",
        body,
        authenticated: false,
      }),
      startSession: finishSession,
    }, values);
  };

  const logout = async () => {
    try {
      await api.request("/auth/logout", { method: "POST" });
    } catch {
      // Local sign-out must remain available while offline.
    } finally {
      setUser(null);
      setStartupError(null);
      setStatus("anonymous");
      queryClient.clear();
      await tokenStorage.clearToken();
    }
  };

  const updateUser = async (values: Pick<User, "name" | "avatar">) => {
    const updated = await api.request<User>("/users", { method: "PUT", body: values });
    setUser(updated);
    queryClient.setQueryData(["me"], updated);
  };

  return (
    <AuthContext
      value={{
        status,
        user,
        startupError,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        logout,
        retryRestore: () => setRestoreAttempt((value) => value + 1),
        updateUser,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
