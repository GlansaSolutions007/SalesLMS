import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("saleslms_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.token;
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }
    } catch {
      // Ignore storage errors and continue without auth header.
    }
  }

  return config;
});

export default api;
