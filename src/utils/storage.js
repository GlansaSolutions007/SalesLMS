// Persists the auth token + user across page reloads. "Remember Me" decides
// which Web Storage backend is used: localStorage survives browser restarts,
// sessionStorage clears when the tab closes. Reads always check both, since
// at hydration time we don't know in advance which one was used to store it.
const TOKEN_KEY = "sales_lms_token";
const USER_KEY = "sales_lms_user";
const REMEMBER_KEY = "sales_lms_remember";
export const SESSION_EXPIRED_KEY = "sales_lms_session_expired";

function backendFor(remember) {
  return remember ? localStorage : sessionStorage;
}

export function setToken(token, remember = true) {
  const store = backendFor(remember);
  const other = remember ? sessionStorage : localStorage;
  store.setItem(TOKEN_KEY, token);
  other.removeItem(TOKEN_KEY);
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredUser(user, remember = true) {
  const store = backendFor(remember);
  const other = remember ? sessionStorage : localStorage;
  store.setItem(USER_KEY, JSON.stringify(user));
  other.removeItem(USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRememberPreference() {
  return localStorage.getItem(REMEMBER_KEY) !== "0";
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function flagSessionExpired() {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
}

export function consumeSessionExpiredFlag() {
  const flagged = sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1";
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return flagged;
}
