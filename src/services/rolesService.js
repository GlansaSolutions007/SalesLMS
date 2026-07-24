import api from "./api.js";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getRoles(params, token) {
  return api.get("admin/roles", { params, headers: authHeader(token) });
}

export function createRole(data, token) {
  return api.post("admin/roles", data, { headers: authHeader(token) });
}

export function getPermissions(token) {
  return api.get("permissions", { params: { per_page: 100 }, headers: authHeader(token) });
}
