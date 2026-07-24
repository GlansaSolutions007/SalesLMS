import api from "./api.js";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getSubscriptionPlans(token) {
  return api.get("admin/subscription-plans", { headers: authHeader(token) });
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
