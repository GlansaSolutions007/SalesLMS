import api from "./axios.js";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Company Admin (own company) / Super Admin (any company) ────────────────

// GET /companies/{company}/subscription-renewal-requests
// Response: { success, message, data: [...renewalRequests] }
export function getRenewalRequests(companyId, token) {
  return api.get(`companies/${companyId}/subscription-renewal-requests`, { headers: authHeader(token) });
}

// GET /companies/{company}/subscription-renewal-requests/{id}
export function getRenewalRequest(companyId, requestId, token) {
  return api.get(`companies/${companyId}/subscription-renewal-requests/${requestId}`, { headers: authHeader(token) });
}

// POST /companies/{company}/subscription-renewal-requests  { message? }
// Backend rejects with 422 if a Pending request already exists for this company.
export function createRenewalRequest(companyId, data, token) {
  return api.post(`companies/${companyId}/subscription-renewal-requests`, data, { headers: authHeader(token) });
}

// PATCH /companies/{company}/subscription-renewal-requests/{id}/cancel
export function cancelRenewalRequest(companyId, requestId, token) {
  return api.patch(`companies/${companyId}/subscription-renewal-requests/${requestId}/cancel`, {}, { headers: authHeader(token) });
}

// ── Super Admin only ─────────────────────────────────────────────────────

// GET /admin/expired-subscriptions?search=&page=&per_page=
// Response: { success, message, data: { data: [...subscriptions incl. renewal_request_status], pagination } }
export function getExpiredSubscriptions(params, token) {
  return api.get("admin/expired-subscriptions", { params, headers: authHeader(token) });
}

// GET /admin/renewal-requests?status=&company_id=&search=&page=&per_page=
// Response: { success, message, data: { stats, data: [...], pagination } }
export function getAdminRenewalRequests(params, token) {
  return api.get("admin/renewal-requests", { params, headers: authHeader(token) });
}

// GET /admin/renewal-requests/{id}
// Response: { success, message, data: { renewal_request, company_admin, employees_used, payment_history } }
export function getAdminRenewalRequest(requestId, token) {
  return api.get(`admin/renewal-requests/${requestId}`, { headers: authHeader(token) });
}

// PUT/POST /admin/renewal-requests/{id} — stages plan/date + payment details.
// Sends multipart/form-data (POST) when a payment_proof File is included
// (matches the backend's multipart method-spoof convention used for other
// file-upload updates in this app), otherwise a plain JSON PUT.
export function updateRenewalRequest(requestId, data, token) {
  if (data?.payment_proof instanceof File) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      form.append(key, value);
    });
    return api.post(`admin/renewal-requests/${requestId}`, form, {
      headers: { ...authHeader(token), "Content-Type": "multipart/form-data" },
    });
  }
  return api.put(`admin/renewal-requests/${requestId}`, data, { headers: authHeader(token) });
}

// POST /admin/renewal-requests/{id}/activate
// Backend refuses (422) unless staged payment details are already complete
// and payment_status === "Paid".
export function activateRenewalRequest(requestId, token) {
  return api.post(`admin/renewal-requests/${requestId}/activate`, {}, { headers: authHeader(token) });
}

// POST /admin/renewal-requests/{id}/reject  { rejection_reason }
export function rejectRenewalRequest(requestId, rejectionReason, token) {
  return api.post(`admin/renewal-requests/${requestId}/reject`, { rejection_reason: rejectionReason }, { headers: authHeader(token) });
}
