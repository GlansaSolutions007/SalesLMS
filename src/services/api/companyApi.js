import httpClient, { ApiValidationError, ApiError, toApiError } from "../axios.js";

// Re-exported so existing consumers (AddCompanyPage, CompanyView,
// EditCompanyPage, EmployeeForm, ...) that import these from companyApi.js
// don't need to change their import path.
export { ApiValidationError, ApiError };

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
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

const DEFAULT_PAGINATION = { total: 0, per_page: 10, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /admin/companies?search=&status=&per_page=&sort=&dir=&page=
// Response shape: { success, message, data: { data: [...companies], pagination: {...} } }
export async function getCompanies(params, token) {
  try {
    const res = await httpClient.get("/admin/companies", { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load companies.");
  }
}

// GET /admin/companies/{id}
export async function getCompanyById(id, token) {
  try {
    const res = await httpClient.get(`/admin/companies/${id}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this company.");
  }
}

// POST /admin/companies (multipart/form-data)
export async function createCompany(formData, token) {
  try {
    const res = await httpClient.post("/admin/companies", formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Something went wrong. Please try again.");
  }
}

// PUT /admin/companies/{id} (multipart/form-data). PHP never populates
// $_POST/$_FILES for a literal PUT body, so Laravel's documented workaround
// is method-spoofing: POST the multipart body with a _method=PUT field and
// let the framework route it as PUT. The API contract is still "PUT" from
// the caller's perspective — this is just how it has to reach the server.
export async function updateCompany(id, formData, token) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`/admin/companies/${id}`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Something went wrong. Please try again.");
  }
}
