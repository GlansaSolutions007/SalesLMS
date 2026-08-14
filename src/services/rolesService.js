import api from "./axios.js";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getRoles(params, token) {
  return api.get("admin/roles", { params, headers: authHeader(token) });
}

export function getRole(id, token) {
  return api.get(`admin/roles/${id}`, { headers: authHeader(token) });
}

export function createRole(data, token) {
  return api.post("admin/roles", data, { headers: authHeader(token) });
}

export function updateRole(id, data, token) {
  return api.put(`admin/roles/${id}`, data, { headers: authHeader(token) });
}

export function toggleRoleStatus(id, token) {
  return api.patch(`admin/roles/${id}/status`, {}, { headers: authHeader(token) });
}

export function deleteRole(id, token) {
  return api.delete(`admin/roles/${id}`, { headers: authHeader(token) });
}

export function getRolePermissions(id, token) {
  return api.get(`admin/roles/${id}/permissions`, { headers: authHeader(token) });
}

export function syncRolePermissions(id, permission_ids, token) {
  return api.post(`admin/roles/${id}/permissions`, { permission_ids }, { headers: authHeader(token) });
}

export function getPermissions(token) {
  return api.get("admin/permissions", { params: { per_page: 100 }, headers: authHeader(token) });
}

// ── Standalone Permission CRUD (Permission Management module) ──────────────

export function getPermissionsPaginated(params, token) {
  return api.get("admin/permissions", { params, headers: authHeader(token) });
}

export function getPermissionModules(token) {
  return api.get("admin/permissions/modules", { headers: authHeader(token) });
}

export function getPermission(id, token) {
  return api.get(`admin/permissions/${id}`, { headers: authHeader(token) });
}

export function createPermission(data, token) {
  return api.post("admin/permissions", data, { headers: authHeader(token) });
}

export function updatePermission(id, data, token) {
  return api.put(`admin/permissions/${id}`, data, { headers: authHeader(token) });
}

export function togglePermissionStatus(id, token) {
  return api.patch(`admin/permissions/${id}/status`, {}, { headers: authHeader(token) });
}

export function deletePermission(id, token) {
  return api.delete(`admin/permissions/${id}`, { headers: authHeader(token) });
}
