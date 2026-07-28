import axiosInstance, { toApiError } from "./axios.js";

function getErrorMessage(error) {
  const data = error?.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  const firstValidationError = Object.values(data?.errors ?? {})
    .flat()
    .find((message) => typeof message === "string");

  return firstValidationError ?? error?.message ?? "Unable to sign in. Please try again.";
}

// POST /login — { username } is what the Login page collects (labeled
// "Username or Email"), sent through as `email` to match the API contract.
export async function login({ username, password }) {
  try {
    const response = await axiosInstance.post("/auth/login", { email: username.trim(), password });
    const payload = response.data?.data ?? response.data;
    const token = payload?.token;
    const user = payload?.user;

    if (!token || !user) {
      throw new Error("The login response did not include a user and access token.");
    }

    return { token, user };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// GET /auth/me
export async function getCurrentUser() {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load your profile.");
  }
}

// POST /auth/logout
export async function logout() {
  await axiosInstance.post("/auth/logout");
}

// POST /auth/logout-all
export async function logoutAll() {
  await axiosInstance.post("/auth/logout-all");
}

// POST /auth/refresh-token
export async function refreshToken() {
  try {
    const res = await axiosInstance.post("/auth/refresh-token");
    const body = res.data?.data ?? res.data;
    return body?.token;
  } catch (error) {
    throw toApiError(error, "Could not refresh your session.");
  }
}

// POST /auth/profile (multipart/form-data — profile_image is a file)
export async function updateProfile(formData) {
  try {
    const res = await axiosInstance.post("/auth/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update your profile.");
  }
}

// POST /auth/change-password
export async function changePassword({ current_password, password, password_confirmation }) {
  try {
    const res = await axiosInstance.post("/auth/change-password", { current_password, password, password_confirmation });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not change your password.");
  }
}

// POST /auth/forgot-password — public route, no Authorization header required.
export async function forgotPassword({ email }) {
  try {
    const res = await axiosInstance.post("/auth/forgot-password", { email });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not send reset instructions. Please try again.");
  }
}

// POST /auth/reset-password — public route, no Authorization header required.
export async function resetPassword({ email, token, password, password_confirmation }) {
  try {
    const res = await axiosInstance.post("/auth/reset-password", { email, token, password, password_confirmation });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not reset your password. Please try again.");
  }
}
