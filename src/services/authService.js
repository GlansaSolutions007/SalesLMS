import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

function loginUrl() {
  if (!apiBaseUrl) {
    throw new Error("API URL is missing. Set VITE_API_URL in your .env file and restart Vite.");
  }

  return `${apiBaseUrl}/api/auth/login`;
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  const firstValidationError = Object.values(data?.errors ?? {})
    .flat()
    .find((message) => typeof message === "string");

  return firstValidationError ?? error?.message ?? "Unable to sign in. Please try again.";
}

export async function login({ username, password }) {
  try {
    const response = await axios.post(loginUrl(), {
      email: username.trim(),
      password,
    });

    const payload = response.data?.data ?? response.data;
    const token = payload?.token ?? payload?.accessToken;
    const user = payload?.user;

    if (!token || !user) {
      throw new Error("The login response did not include a user and access token.");
    }

    return { data: { ...payload, token, user } };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
