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

// GET /companies/{company}/employees/{employee}/target-defaults — the
// employee's configured Sales & Marketing target fields, used to default
// (and let the admin override) a new target's values.
export async function getEmployeeTargetDefaults(companyId, employeeId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employees/${employeeId}/target-defaults`);
    return res.data?.data ?? null;
  } catch (err) {
    throw toApiError(err, "Could not load this employee's configured targets.");
  }
}

// POST /companies/{company}/monthly-targets/recurring — { preview_only: true }
// computes the periods for a Target Frequency (This Month/Monthly/Quarterly/
// Half Yearly/Yearly) and flags any that overlap an existing target, without
// creating anything. Same backend logic a real submit uses, so the preview
// can never disagree with what actually gets created.
export async function previewRecurringTargets(companyId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/monthly-targets/recurring`, {
      ...payload,
      preview_only: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not preview these target periods.");
  }
}

// POST /companies/{company}/monthly-targets/recurring — creates every
// generated period in one all-or-nothing operation (backend rolls back the
// whole batch if any period overlaps an existing target).
export async function createRecurringTargets(companyId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/monthly-targets/recurring`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create these targets.");
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

// ── Historical / Previous Achievement Import ─────────────────────────────

// GET /companies/{company}/historical-achievements/template
export async function downloadHistoricalAchievementTemplate(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/historical-achievements/template`, { responseType: "blob" });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not download the import template.");
  }
}

// POST /companies/{company}/historical-achievements/preview
export async function previewHistoricalAchievementImport(companyId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await httpClient.post(`/companies/${companyId}/historical-achievements/preview`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not validate the file.");
  }
}

// POST /companies/{company}/historical-achievements/import
export async function importHistoricalAchievement(companyId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await httpClient.post(`/companies/${companyId}/historical-achievements/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not import previous achievement.");
  }
}
