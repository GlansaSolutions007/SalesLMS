import axios from "axios";
import httpClient from "./httpClient.js";

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

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function toApiError(error, fallbackMessage) {
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

export async function getSubscriptionPlans(token) {
  try {
    const res = await httpClient.get("/subscription-plans", { headers: authHeaders(token) });
    const body = res.data;
    return Array.isArray(body) ? body : (body?.data ?? []);
  } catch (error) {
    throw toApiError(error, "Could not load subscription plans.");
  }
}

export async function createCompany(formData, token) {
  try {
    const res = await httpClient.post("/companies", formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Something went wrong. Please try again.");
  }
}
