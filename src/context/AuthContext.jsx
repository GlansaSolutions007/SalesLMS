import { createContext, useContext, useState } from "react";
import { login as loginRequest } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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
  }

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
