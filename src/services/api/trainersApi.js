import httpClient, { ApiValidationError, ApiError, toApiError } from "../axios.js";

export { ApiValidationError, ApiError };

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

const DEFAULT_PAGINATION = { total: 0, per_page: 10, current_page: 1, last_page: 1, from: 0, to: 0 };

export async function getTrainers(params, token) {
  try {
    const res = await httpClient.get("/admin/trainers", { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load trainers.");
  }
}

export async function getTrainerById(id, token) {
  try {
    const res = await httpClient.get(`/admin/trainers/${id}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load trainer.");
  }
}

export async function createTrainer(formData, token) {
  try {
    const res = await httpClient.post("/admin/trainers", formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create trainer.");
  }
}

export async function updateTrainer(id, formData, token) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`/admin/trainers/${id}`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update trainer.");
  }
}

export async function updateTrainerStatus(id, status, token) {
  try {
    const res = await httpClient.patch(`/admin/trainers/${id}/status`, { status }, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update trainer status.");
  }
}

export async function deleteTrainer(id, token) {
  try {
    const res = await httpClient.delete(`/admin/trainers/${id}`, { headers: authHeaders(token) });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not deactivate trainer.");
  }
}

export async function getTrainerSkills(trainerId, token) {
  try {
    const res = await httpClient.get(`/admin/trainers/${trainerId}/skills`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load trainer skills.");
  }
}

export async function addTrainerSkill(trainerId, data, token) {
  try {
    const res = await httpClient.post(`/admin/trainers/${trainerId}/skills`, data, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not add skill.");
  }
}

export async function updateTrainerSkill(trainerId, skillId, data, token) {
  try {
    const res = await httpClient.put(`/admin/trainers/${trainerId}/skills/${skillId}`, data, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update skill.");
  }
}

export async function deleteTrainerSkill(trainerId, skillId, token) {
  try {
    const res = await httpClient.delete(`/admin/trainers/${trainerId}/skills/${skillId}`, { headers: authHeaders(token) });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not remove skill.");
  }
}
