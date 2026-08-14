import httpClient, { toApiError } from "../axios.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/monthly-targets?employee_id=
export async function getCompanyTargets(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/monthly-targets`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load monthly targets.");
  }
}

// GET /companies/{company}/monthly-targets/{monthlyTarget}
export async function getTarget(companyId, targetId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/monthly-targets/${targetId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this target.");
  }
}

// POST /companies/{company}/monthly-targets
export async function createTarget(companyId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/monthly-targets`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create this target.");
  }
}

// PUT /companies/{company}/monthly-targets/{monthlyTarget}
export async function updateTarget(companyId, targetId, payload) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/monthly-targets/${targetId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update this target.");
  }
}

// DELETE /companies/{company}/monthly-targets/{monthlyTarget}
export async function deleteTarget(companyId, targetId) {
  try {
    await httpClient.delete(`/companies/${companyId}/monthly-targets/${targetId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete this target.");
  }
}

// GET /companies/{company}/employees/{employee}/target-achievement?period=YYYY-MM
export async function getTargetAchievement(companyId, employeeId, period) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employees/${employeeId}/target-achievement`, {
      params: period ? { period } : {},
    });
    return res.data?.data ?? null;
  } catch (err) {
    throw toApiError(err, "Could not load target achievement.");
  }
}

// GET /companies/{company}/my-target
export async function getMyTarget(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-target`);
    return res.data?.data ?? null;
  } catch (err) {
    throw toApiError(err, "Could not load your target.");
  }
}
