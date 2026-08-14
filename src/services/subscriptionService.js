import api from "./axios.js";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /admin/subscription-plans?search=&status=&per_page=&page=
// Response shape: { success, message, data: { data: [...plans], pagination: {...} } }
export function getSubscriptionPlans(params, token) {
  return api.get("admin/subscription-plans", { headers: authHeader(token), params });
}

export function createSubscriptionPlan(data, token) {
  return api.post("admin/subscription-plans", data, { headers: authHeader(token) });
}

export function updateSubscriptionPlan(id, data, token) {
  return api.put(`admin/subscription-plans/${id}`, data, { headers: authHeader(token) });
}

export function deleteSubscriptionPlan(id, token) {
  return api.delete(`admin/subscription-plans/${id}`, { headers: authHeader(token) });
}

// ── Company Subscriptions (lifecycle) ───────────────────────────────────────

// GET /admin/subscriptions?search=&status=&payment_status=&expiring_soon=&per_page=&page= (Super Admin, platform-wide)
export function getAllSubscriptions(params, token) {
  return api.get("admin/subscriptions", { params, headers: authHeader(token) });
}

// GET /companies/{company}/subscriptions
export function getCompanySubscriptions(companyId, token) {
  return api.get(`companies/${companyId}/subscriptions`, { headers: authHeader(token) });
}

// POST /admin/companies/{company}/subscriptions/{subscription}/renew
// Also backs the "Upgrade" action — pass { plan_id } to switch plans; the
// backend auto-classifies the resulting record as Renewal/Upgrade/Downgrade
// by comparing price_per_employee, so there's no separate upgrade endpoint.
export function renewSubscription(companyId, subscriptionId, data, token) {
  return api.post(`admin/companies/${companyId}/subscriptions/${subscriptionId}/renew`, data, { headers: authHeader(token) });
}

// POST /admin/companies/{company}/subscriptions/{subscription}/extend
export function extendSubscription(companyId, subscriptionId, data, token) {
  return api.post(`admin/companies/${companyId}/subscriptions/${subscriptionId}/extend`, data, { headers: authHeader(token) });
}

// PATCH /admin/companies/{company}/subscriptions/{subscription}/payment
export function updateSubscriptionPaymentStatus(companyId, subscriptionId, payment_status, token) {
  return api.patch(`admin/companies/${companyId}/subscriptions/${subscriptionId}/payment`, { payment_status }, { headers: authHeader(token) });
}

// PATCH /admin/companies/{company}/subscriptions/{subscription}/cancel
export function cancelSubscription(companyId, subscriptionId, reason, token) {
  return api.patch(`admin/companies/${companyId}/subscriptions/${subscriptionId}/cancel`, { reason }, { headers: authHeader(token) });
}

// PATCH /admin/companies/{company}/subscriptions/{subscription}/suspend
// Not wired to a Company Profile button yet (see subscription.todo.md) —
// exposed for Super Admin / future automation.
export function suspendSubscription(companyId, subscriptionId, reason, token) {
  return api.patch(`admin/companies/${companyId}/subscriptions/${subscriptionId}/suspend`, { reason }, { headers: authHeader(token) });
}

// PATCH /admin/companies/{company}/subscriptions/{subscription}/reactivate
export function reactivateSubscription(companyId, subscriptionId, token) {
  return api.patch(`admin/companies/${companyId}/subscriptions/${subscriptionId}/reactivate`, {}, { headers: authHeader(token) });
}
