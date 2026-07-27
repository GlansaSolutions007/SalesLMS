import { createContext, useContext, useEffect, useState } from "react";
import { login as loginRequest } from "../services/authService.js";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "saleslms_auth";

function readStoredAuth() {
  if (typeof window === "undefined") return { user: null, token: null };

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, token: null };

    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user ?? null,
      token: parsed?.token ?? null,
    };
  } catch {
    return { user: null, token: null };
  }
}

function persistAuth(user, token) {
  if (typeof window === "undefined") return;

  if (user && token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth().user);
  const [token, setToken] = useState(() => readStoredAuth().token);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function login(credentials) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginRequest(credentials);
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data.user;
    } catch (err) {
      setError(err?.message ?? "Login failed.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    persistAuth(null, null);
  }

  useEffect(() => {
    persistAuth(user, token);
  }, [user, token]);

  const permissions = user?.permissions ?? [];

  const value = {
    isAuthenticated: Boolean(user),
    user,
    token,
    roleName: user?.role?.name ?? null,
    permissions,
    hasPermission: (perm) => permissions.includes(perm),
    hasAnyPermission: (perms) => perms.some((p) => permissions.includes(p)),
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
