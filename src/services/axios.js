import axios from "axios";
import { getToken, setToken, clearAuthStorage, flagSessionExpired, getRememberPreference } from "../utils/storage.js";
import { ROUTES } from "../router/routePaths.js";

const baseURL = import.meta.env.REACT_VITE_API_URL;

if (!baseURL && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn("REACT_VITE_API_URL is not set — API requests will fail. Copy .env.example to .env and set it.");
}

// The one Axios instance the whole app shares — every service imports this
// instead of creating its own client, so the Authorization header and the
// 401/refresh/logout behavior below apply everywhere automatically.
const axiosInstance = axios.create({ baseURL });

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers.Accept = config.headers.Accept ?? "application/json";
  return config;
});

// Requests that must never trigger the refresh-and-retry dance — a failed
// login is just "wrong credentials", and a failed refresh call refreshing
// itself would loop forever.
const AUTH_EXEMPT_PATHS = ["/login", "/auth/refresh-token"];

function isAuthExempt(url) {
  return AUTH_EXEMPT_PATHS.some((path) => url?.includes(path));
}

// Multiple requests can 401 at once (e.g. a page firing several calls in
// parallel) — share a single in-flight refresh instead of firing one per
// request.
let refreshPromise = null;

function performRefresh() {
  if (!refreshPromise) {
    refreshPromise = axiosInstance
      .post("/auth/refresh-token")
      .then((res) => {
        const body = res.data?.data ?? res.data;
        const nextToken = body?.token;
        if (!nextToken) throw new Error("Refresh response did not include a token.");
        setToken(nextToken, getRememberPreference());
        return nextToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function forceLogoutRedirect() {
  clearAuthStorage();
  flagSessionExpired();
  if (typeof window !== "undefined") {
    window.location.assign(ROUTES.LOGIN);
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthExempt(originalRequest.url)) {
      originalRequest._retry = true;
      try {
        const nextToken = await performRefresh();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        forceLogoutRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export class ApiValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = "ApiValidationError";
    this.errors = errors;
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function toApiError(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 422 && data?.errors) {
      return new ApiValidationError(data.message ?? "Please fix the highlighted fields.", data.errors);
    }

    return new ApiError(data?.message ?? error.message ?? fallbackMessage, status);
  }

  return new ApiError(fallbackMessage);
}

export default axiosInstance;
