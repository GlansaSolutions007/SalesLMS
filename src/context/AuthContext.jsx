import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as authService from "../services/authService.js";
import { getToken, getStoredUser, setToken, setStoredUser, clearAuthStorage, getRememberPreference } from "../utils/storage.js";

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
  // Hydrated synchronously from storage so a page refresh never bounces an
  // already-logged-in user back to /login before React even renders once.
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setTokenState] = useState(() => getToken());
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function persistSession(nextToken, nextUser, remember) {
    setToken(nextToken, remember);
    setStoredUser(nextUser, remember);
    setTokenState(nextToken);
    setUser(nextUser);
  }

  async function login({ username, password }, remember = true) {
    setIsLoading(true);
    setError(null);
    try {
      const { token: loginToken, user: loginUser } = await authService.login({ username, password });
      persistSession(loginToken, loginUser, remember);

      // Refresh with the fuller /auth/me payload (permissions, etc.) without
      // blocking on it — the login response's user is good enough either way.
      try {
        const freshUser = await authService.getCurrentUser();
        persistSession(loginToken, freshUser, remember);
      } catch {
        /* keep the user object the login response already gave us */
      }

      return loginUser;
    } catch (err) {
      setError(err?.message ?? "Login failed.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      /* clear the local session regardless of whether the API call succeeded */
    } finally {
      clearAuthStorage();
      setTokenState(null);
      setUser(null);
    }
  }

  async function logoutAll() {
    try {
      await authService.logoutAll();
    } finally {
      clearAuthStorage();
      setTokenState(null);
      setUser(null);
    }
  }

  async function refreshTokenValue() {
    const nextToken = await authService.refreshToken();
    if (nextToken) {
      setToken(nextToken, getRememberPreference());
      setTokenState(nextToken);
    }
    return nextToken;
  }

  function changePassword(payload) {
    return authService.changePassword(payload);
  }

  async function fetchCurrentUser() {
    const freshUser = await authService.getCurrentUser();
    setStoredUser(freshUser, getRememberPreference());
    setUser(freshUser);
    return freshUser;
  }

  async function updateProfile(formData) {
    const freshUser = await authService.updateProfile(formData);
    setStoredUser(freshUser, getRememberPreference());
    setUser(freshUser);
    return freshUser;
  }

  const permissions = user?.permissions ?? [];
  const roleName = user?.role?.name ?? null;
  const isAuthenticated = Boolean(user && token);
  const isSuperAdmin = roleName === "Super Admin";
  // Super Admin and users with no company (shouldn't happen post-login, but
  // matches the backend's own `$user->company &&` guard in ApiAuthenticate)
  // are never gated. `subscription_active === false` is an explicit check
  // (not just falsy) so a user object from before this field existed, still
  // sitting in localStorage, doesn't get misread as expired.
  const subscriptionExpired = !isSuperAdmin && user?.company && user.company.subscription_active === false;

  // Keeps `user.company.subscription_active` from going stale while a tab
  // stays open — e.g. a Super Admin renews a company's subscription while
  // one of that company's users is already logged in elsewhere. The actual
  // access control is enforced live on every API call by ApiAuthenticate
  // regardless of this; this just keeps the banner/route-guard in sync so
  // access is restored without the "no logout required" ask forcing a
  // manual refresh.
  const fetchCurrentUserRef = useRef();
  fetchCurrentUserRef.current = fetchCurrentUser;
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const interval = setInterval(() => {
      fetchCurrentUserRef.current().catch(() => {
        /* transient failure — next tick retries */
      });
    }, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value = {
    // Kept as a boolean (not a callable) so every existing `const { isAuthenticated } = useAuth()`
    // consumer in the app keeps working unchanged.
    isAuthenticated,
    user,
    token,
    roleName,
    isSuperAdmin,
    subscriptionExpired,
    permissions,
    hasPermission: (perm) => permissions.includes(perm),
    hasAnyPermission: (perms) => perms.some((p) => permissions.includes(p)),
    hasRole: (role) => (Array.isArray(role) ? role.includes(roleName) : role === roleName),
    isLoading,
    error,
    login,
    logout,
    logoutAll,
    refreshToken: refreshTokenValue,
    changePassword,
    fetchCurrentUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
