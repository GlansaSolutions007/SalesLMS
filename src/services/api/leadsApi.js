import httpClient, { toApiError } from "../axios.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/leads?status=&assigned=&employee_id=&source=&search=&page=
export async function getCompanyLeads(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load leads.");
  }
}

// GET /companies/{company}/leads/{lead}
export async function getLead(companyId, leadId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/${leadId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this lead.");
  }
}

// POST /companies/{company}/leads (manual entry)
export async function createLead(companyId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/leads`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create this lead.");
  }
}

// PUT /companies/{company}/leads/{lead}
export async function updateLead(companyId, leadId, payload) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/leads/${leadId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update this lead.");
  }
}

// DELETE /companies/{company}/leads/{lead}
export async function deleteLead(companyId, leadId) {
  try {
    await httpClient.delete(`/companies/${companyId}/leads/${leadId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete this lead.");
  }
}

// GET /companies/{company}/leads/{lead}/status-history
export async function getLeadStatusHistory(companyId, leadId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/${leadId}/status-history`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load status history.");
  }
}

// POST /companies/{company}/leads/import (multipart, .xlsx or .csv)
export async function importLeads(companyId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await httpClient.post(`/companies/${companyId}/leads/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not import leads.");
  }
}

// GET /companies/{company}/leads/imports
export async function getLeadImports(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/imports`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load import history.");
  }
}

// GET /companies/{company}/leads/imports/{leadImport}
export async function getLeadImport(companyId, importId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/imports/${importId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this import.");
  }
}

// POST /companies/{company}/leads/assign — { lead_ids, employee_id, reason? }
// Covers Assign, Reassign, and Bulk Assign alike — leads are assigned only
// to individual employees, never to a team.
export async function assignLeads(companyId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/leads/assign`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not assign leads.");
  }
}

// Reassign a single lead — same endpoint as assign/bulk-assign, one lead id.
export async function reassignLead(companyId, leadId, employeeId, reason) {
  return assignLeads(companyId, { lead_ids: [leadId], employee_id: employeeId, reason: reason || undefined });
}

// GET /companies/{company}/leads/export?status=&source=&priority=&employee_id=&verification_status=
export async function exportLeads(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/export`, { params, responseType: "blob" });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not export leads.");
  }
}

// GET /companies/{company}/leads/import-template
export async function downloadLeadImportTemplate(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/import-template`, { responseType: "blob" });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not download the import template.");
  }
}

// ── Follow-ups (admin, read-only views) ──────────────────────────────────

// GET /companies/{company}/leads/{lead}/followups
export async function getLeadFollowups(companyId, leadId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/leads/${leadId}/followups`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load follow-ups.");
  }
}

// GET /companies/{company}/followups?status=&employee_id=&date_from=&date_to=&today=
export async function getCompanyFollowups(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/followups`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load follow-ups.");
  }
}

// ── Lead Conversions (admin verification) ────────────────────────────────

// GET /companies/{company}/lead-conversions?status=
export async function getLeadConversions(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/lead-conversions`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load conversions.");
  }
}

// PATCH /companies/{company}/lead-conversions/{leadConversion}/verify — { decision, verification_remarks? }
export async function verifyLeadConversion(companyId, conversionId, payload) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/lead-conversions/${conversionId}/verify`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not verify this conversion.");
  }
}

// ── My Leads (Employee) ───────────────────────────────────────────────────

// GET /companies/{company}/my-leads?status=&search=&follow_up_date=&today_followups=
export async function getMyLeads(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-leads`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load your leads.");
  }
}

// GET /companies/{company}/my-leads/{lead}
export async function getMyLead(companyId, leadId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-leads/${leadId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this lead.");
  }
}

// PATCH /companies/{company}/my-leads/{lead}/status — { status, remarks?,
// followup_required?, followup_type?, followup_notes?, next_follow_up_date?,
// next_follow_up_time? } — a truthy followup_required also logs a follow-up
// (type/date/time required) in the same atomic request.
export async function updateMyLeadStatus(companyId, leadId, payload) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/my-leads/${leadId}/status`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update the lead status.");
  }
}

// POST /companies/{company}/my-leads/{lead}/conversion — multipart form:
// { conversion_date, converted_amount, reference_number?, remarks?, supporting_document? }
export async function submitLeadConversion(companyId, leadId, payload) {
  try {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") formData.append(key, value);
    });
    const res = await httpClient.post(`/companies/${companyId}/my-leads/${leadId}/conversion`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not submit this conversion.");
  }
}

// GET /companies/{company}/my-leads/{lead}/followups
export async function getMyLeadFollowups(companyId, leadId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-leads/${leadId}/followups`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load follow-ups.");
  }
}

// POST /companies/{company}/my-leads/{lead}/followups
export async function createMyLeadFollowup(companyId, leadId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/my-leads/${leadId}/followups`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not add this follow-up.");
  }
}

// GET /companies/{company}/my-leads/verification-requests/eligible?search=&per_page=&page=
// Leads owned by the logged-in employee that are still open for a fresh
// bulk verification request — the backend already excludes Closed Lost,
// Verified, and already-requested leads, so nothing extra is filtered here.
export async function getEligibleVerificationLeads(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-leads/verification-requests/eligible`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load leads eligible for verification.");
  }
}

// POST /companies/{company}/my-leads/verification-requests/bulk — { lead_ids }
// Returns { requested, skipped } — the backend re-validates every id
// (ownership + eligibility) regardless of what the list showed, so a
// partial result (some skipped) is a normal, expected outcome, not an error.
export async function bulkSubmitVerificationRequests(companyId, leadIds) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/my-leads/verification-requests/bulk`, { lead_ids: leadIds });
    return { ...(res.data?.data ?? {}), message: res.data?.message };
  } catch (err) {
    throw toApiError(err, "Could not send verification requests.");
  }
}

// GET /companies/{company}/my-followups?status=&search=&date=&today=
export async function getMyFollowups(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-followups`, { params });
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load your follow-ups.");
  }
}

// PATCH /companies/{company}/my-followups/{followup} — { status: Completed|Missed|Cancelled, notes? }
export async function updateMyFollowup(companyId, followupId, payload) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/my-followups/${followupId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update this follow-up.");
  }
}
