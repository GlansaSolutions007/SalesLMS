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
