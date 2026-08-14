import httpClient, { ApiValidationError, ApiError, toApiError } from "../axios.js";

// Re-exported so existing consumers (AddCompanyPage, CompanyView,
// EditCompanyPage, EmployeeForm, ...) that import these from companyApi.js
// don't need to change their import path.
export { ApiValidationError, ApiError };

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

export async function getSubscriptionPlans(token) {
  try {
    const res = await httpClient.get("/subscription-plans", { headers: authHeaders(token) });
    const body = res.data;
    return Array.isArray(body) ? body : (body?.data ?? []);
  } catch (error) {
    throw toApiError(error, "Could not load subscription plans.");
  }
}

const DEFAULT_PAGINATION = { total: 0, per_page: 10, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /admin/companies?search=&status=&per_page=&sort=&dir=&page=
// Response shape: { success, message, data: { data: [...companies], pagination: {...} } }
export async function getCompanies(params, token) {
  try {
    const res = await httpClient.get("/admin/companies", { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load companies.");
  }
}

// GET /admin/companies/{id}
export async function getCompanyById(id, token) {
  try {
    const res = await httpClient.get(`/admin/companies/${id}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this company.");
  }
}

// GET /companies/{id} — same CompanyController@show as above, but reachable
// by a Company Admin viewing their own company profile (not just Super
// Admin browsing the companies list). CompanyController::authorizeCompanyAccess
// still enforces that a Company Admin can only ever load their own company_id.
export async function getCompanyProfile(id, token) {
  try {
    const res = await httpClient.get(`/companies/${id}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load your company profile.");
  }
}

// PUT /companies/{id} (multipart/form-data, method-spoofed like updateCompany
// below) — the Company Admin counterpart of updateCompany, targeting the
// non-admin-prefixed route a Company Admin is actually authorized to hit.
export async function updateCompanyProfile(id, formData, token) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`/companies/${id}`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Something went wrong. Please try again.");
  }
}

// POST /admin/companies (multipart/form-data)
export async function createCompany(formData, token) {
  try {
    const res = await httpClient.post("/admin/companies", formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Something went wrong. Please try again.");
  }
}

// NOTE on the routes below: everything from here down (branches, departments,
// designations, employees + employee sub-resources) lives in a backend route
// group (routes/api.php, the "Super Admin + Company Admin — Company
// Configuration" block) that — unlike the Company CRUD group above — was
// never given a `->prefix('admin')`. Those endpoints are therefore actually
// registered at `/companies/{company}/...`, not `/admin/companies/{company}/...`.
// Fixing that on the backend wasn't an option here, so these calls target the
// routes as they really exist rather than the `/admin/...` shape the rest of
// this file uses.

// GET /companies/{company}/branches
// Response shape: { success, message, data: [...branches] }
export async function getCompanyBranches(companyId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/branches`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load branches for this company.");
  }
}

// GET /companies/{company}/branches/{branch}
export async function getCompanyBranch(companyId, branchId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/branches/${branchId}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this branch.");
  }
}

// POST /companies/{company}/branches
export async function createCompanyBranch(companyId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/branches`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this branch.");
  }
}

// PUT /companies/{company}/branches/{branch}
export async function updateCompanyBranch(companyId, branchId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/branches/${branchId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this branch.");
  }
}

// GET /companies/{company}/departments
// Response shape: { success, message, data: [...departments] }
export async function getCompanyDepartments(companyId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/departments`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load departments for this company.");
  }
}

// GET /companies/{company}/departments/{department}
export async function getCompanyDepartment(companyId, departmentId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/departments/${departmentId}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this department.");
  }
}

// POST /companies/{company}/departments
export async function createCompanyDepartment(companyId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/departments`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this department.");
  }
}

// PUT /companies/{company}/departments/{department}
export async function updateCompanyDepartment(companyId, departmentId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/departments/${departmentId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this department.");
  }
}

// GET /companies/{company}/designations
// Response shape: { success, message, data: [...designations] }
export async function getCompanyDesignations(companyId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/designations`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load designations for this company.");
  }
}

// GET /companies/{company}/designations/{designation}
export async function getCompanyDesignation(companyId, designationId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/designations/${designationId}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this designation.");
  }
}

// POST /companies/{company}/designations
export async function createCompanyDesignation(companyId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/designations`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this designation.");
  }
}

// PUT /companies/{company}/designations/{designation}
export async function updateCompanyDesignation(companyId, designationId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/designations/${designationId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this designation.");
  }
}

// GET /companies/{company}/employees?search=&status=&branch_id=&department_id=&designation_id=&employment_type=&sort=&dir=&page=&per_page=
// Response shape: { success, message, data: { data: [...employees], pagination: {...} } }
export async function getCompanyEmployees(companyId, params, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employees`, { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load employees.");
  }
}

// GET /companies/{company}/employees/{employee}
export async function getCompanyEmployee(companyId, employeeId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employees/${employeeId}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this employee.");
  }
}

// POST /companies/{company}/employees (multipart/form-data)
export async function createCompanyEmployee(companyId, formData, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/employees`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this employee.");
  }
}

// PUT /companies/{company}/employees/{employee} (multipart/form-data, method-spoofed — see updateCompany below)
export async function updateCompanyEmployee(companyId, employeeId, formData, token) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`/companies/${companyId}/employees/${employeeId}`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this employee.");
  }
}

// PATCH /companies/{company}/employees/{employee}/status
export async function updateCompanyEmployeeStatus(companyId, employeeId, payload, token) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/employees/${employeeId}/status`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this employee's status.");
  }
}

// DELETE /companies/{company}/employees/{employee} — soft-deactivates (sets status = Inactive)
export async function deactivateCompanyEmployee(companyId, employeeId, token) {
  try {
    const res = await httpClient.delete(`/companies/${companyId}/employees/${employeeId}`, { headers: authHeaders(token) });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not deactivate this employee.");
  }
}

// POST /companies/{company}/employees/{employee}/addresses — upserts by address_type (Current/Permanent)
export async function saveCompanyEmployeeAddress(companyId, employeeId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/employees/${employeeId}/addresses`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not save this address.");
  }
}

// POST /companies/{company}/employees/{employee}/skills
export async function createCompanyEmployeeSkill(companyId, employeeId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/employees/${employeeId}/skills`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not save this skill.");
  }
}

// PUT /companies/{company}/employees/{employee}/skills/{skill}
export async function updateCompanyEmployeeSkill(companyId, employeeId, skillId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/employees/${employeeId}/skills/${skillId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this skill.");
  }
}

// DELETE /companies/{company}/employees/{employee}/skills/{skill}
export async function deleteCompanyEmployeeSkill(companyId, employeeId, skillId, token) {
  try {
    const res = await httpClient.delete(`/companies/${companyId}/employees/${employeeId}/skills/${skillId}`, { headers: authHeaders(token) });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not delete this skill.");
  }
}

// POST /companies/{company}/employees/{employee}/emergency-contacts
export async function createCompanyEmployeeEmergencyContact(companyId, employeeId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/employees/${employeeId}/emergency-contacts`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not save this emergency contact.");
  }
}

// PUT /companies/{company}/employees/{employee}/emergency-contacts/{contact}
export async function updateCompanyEmployeeEmergencyContact(companyId, employeeId, contactId, payload, token) {
  try {
    const res = await httpClient.put(
      `/companies/${companyId}/employees/${employeeId}/emergency-contacts/${contactId}`,
      payload,
      { headers: authHeaders(token) }
    );
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this emergency contact.");
  }
}

// DELETE /companies/{company}/employees/{employee}/emergency-contacts/{contact}
export async function deleteCompanyEmployeeEmergencyContact(companyId, employeeId, contactId, token) {
  try {
    const res = await httpClient.delete(`/companies/${companyId}/employees/${employeeId}/emergency-contacts/${contactId}`, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not delete this emergency contact.");
  }
}

// GET /companies/{company}/employees/{employee}/documents
export async function getCompanyEmployeeDocuments(companyId, employeeId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employees/${employeeId}/documents`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load documents for this employee.");
  }
}

// POST /companies/{company}/employees/{employee}/documents (multipart/form-data)
export async function createCompanyEmployeeDocument(companyId, employeeId, formData, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/employees/${employeeId}/documents`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not upload this document.");
  }
}

// DELETE /companies/{company}/employees/{employee}/documents/{document}
export async function deleteCompanyEmployeeDocument(companyId, employeeId, documentId, token) {
  try {
    const res = await httpClient.delete(`/companies/${companyId}/employees/${employeeId}/documents/${documentId}`, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not delete this document.");
  }
}

// PUT /admin/companies/{id} (multipart/form-data). PHP never populates
// $_POST/$_FILES for a literal PUT body, so Laravel's documented workaround
// is method-spoofing: POST the multipart body with a _method=PUT field and
// let the framework route it as PUT. The API contract is still "PUT" from
// the caller's perspective — this is just how it has to reach the server.
export async function updateCompany(id, formData, token) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`/admin/companies/${id}`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Something went wrong. Please try again.");
  }
}

// GET /companies/{company}/batches?course_id=&status=&per_page=&sort=&dir=&page=
// Response shape: { success, message, data: { data: [...batches], pagination: {...} } }
export async function getCompanyBatches(companyId, params, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/batches`, { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load batches for this company.");
  }
}

// GET /companies/{company}/batches/{batch}
export async function getCompanyBatch(companyId, batchId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/batches/${batchId}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this batch.");
  }
}

// POST /companies/{company}/batches
export async function createCompanyBatch(companyId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/batches`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this batch.");
  }
}

// PUT /companies/{company}/batches/{batch}
export async function updateCompanyBatch(companyId, batchId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/batches/${batchId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this batch.");
  }
}

// ── Company Settings (Super Admin + Company Admin) ──────────────────────────
// GET /companies/{company}/settings
export async function getCompanySettings(companyId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/settings`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load company settings.");
  }
}

// PUT /companies/{company}/settings
export async function updateCompanySettings(companyId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/settings`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update company settings.");
  }
}

// ── Company Admins (Super Admin only) ───────────────────────────────────────
// GET /admin/companies/{company}/admins
export async function getCompanyAdmins(companyId, token) {
  try {
    const res = await httpClient.get(`/admin/companies/${companyId}/admins`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load admins for this company.");
  }
}

// POST /admin/companies/{company}/admins
export async function createCompanyAdmin(companyId, payload, token) {
  try {
    const res = await httpClient.post(`/admin/companies/${companyId}/admins`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this admin.");
  }
}

// PUT /admin/companies/{company}/admins/{admin}
export async function updateCompanyAdmin(companyId, adminId, payload, token) {
  try {
    const res = await httpClient.put(`/admin/companies/${companyId}/admins/${adminId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this admin.");
  }
}

// PATCH /admin/companies/{company}/admins/{admin}/reset-password
export async function resetCompanyAdminPassword(companyId, adminId, payload, token) {
  try {
    const res = await httpClient.patch(`/admin/companies/${companyId}/admins/${adminId}/reset-password`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not reset this admin's password.");
  }
}

// PATCH /admin/companies/{company}/admins/{admin}/toggle-status
export async function toggleCompanyAdminStatus(companyId, adminId, token) {
  try {
    const res = await httpClient.patch(`/admin/companies/${companyId}/admins/${adminId}/toggle-status`, {}, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this admin's status.");
  }
}

// ── Company Documents (Super Admin + Company Admin) ─────────────────────────
// GET /companies/{company}/documents
export async function getCompanyDocuments(companyId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/documents`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load documents for this company.");
  }
}

// POST /companies/{company}/documents (multipart/form-data)
export async function createCompanyDocument(companyId, formData, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/documents`, formData, {
      headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not upload this document.");
  }
}

// PATCH /companies/{company}/documents/{document}/verify
export async function verifyCompanyDocument(companyId, documentId, payload, token) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/documents/${documentId}/verify`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this document's verification status.");
  }
}

// DELETE /companies/{company}/documents/{document}
export async function deleteCompanyDocument(companyId, documentId, token) {
  try {
    const res = await httpClient.delete(`/companies/${companyId}/documents/${documentId}`, { headers: authHeaders(token) });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not delete this document.");
  }
}

// ── Batch Enrollments ────────────────────────────────────────────────────────
// GET /companies/{company}/batches/{batch}/enrollments
export async function getBatchEnrollments(companyId, batchId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/batches/${batchId}/enrollments`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load enrollments for this batch.");
  }
}

// POST /companies/{company}/batches/{batch}/enrollments
export async function enrollBatchEmployees(companyId, batchId, employeeIds, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/batches/${batchId}/enrollments`, { employee_ids: employeeIds }, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not enroll these employees.");
  }
}

// PATCH /companies/{company}/batches/{batch}/enrollments/{enrollment}
export async function updateBatchEnrollment(companyId, batchId, enrollmentId, payload, token) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/batches/${batchId}/enrollments/${enrollmentId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this enrollment.");
  }
}

// DELETE /companies/{company}/batches/{batch}/enrollments/{enrollment}
export async function unenrollBatchEmployee(companyId, batchId, enrollmentId, token) {
  try {
    const res = await httpClient.delete(`/companies/${companyId}/batches/${batchId}/enrollments/${enrollmentId}`, { headers: authHeaders(token) });
    return res.data;
  } catch (error) {
    throw toApiError(error, "Could not unenroll this employee.");
  }
}

// ── Training Sessions (per batch) ────────────────────────────────────────────
// GET /companies/{company}/batches/{batch}/training-sessions
export async function getBatchTrainingSessions(companyId, batchId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/batches/${batchId}/training-sessions`, { headers: authHeaders(token) });
    return res.data?.data ?? [];
  } catch (error) {
    throw toApiError(error, "Could not load training sessions for this batch.");
  }
}

// POST /companies/{company}/batches/{batch}/training-sessions
export async function createBatchTrainingSession(companyId, batchId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/batches/${batchId}/training-sessions`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not create this training session.");
  }
}

// PUT /companies/{company}/batches/{batch}/training-sessions/{session}
export async function updateBatchTrainingSession(companyId, batchId, sessionId, payload, token) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/batches/${batchId}/training-sessions/${sessionId}`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this training session.");
  }
}

// PATCH /companies/{company}/batches/{batch}/training-sessions/{session}/status
export async function updateBatchTrainingSessionStatus(companyId, batchId, sessionId, session_status, token) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/batches/${batchId}/training-sessions/${sessionId}/status`, { session_status }, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this session's status.");
  }
}

// DELETE /companies/{company}/batches/{batch}/training-sessions/{session}
export async function deleteBatchTrainingSession(companyId, batchId, sessionId, token) {
  try {
    await httpClient.delete(`/companies/${companyId}/batches/${batchId}/training-sessions/${sessionId}`, { headers: authHeaders(token) });
  } catch (error) {
    throw toApiError(error, "Could not delete this training session.");
  }
}

// ── Employee Progress (built on course_assignments.status) ──────────────────
// GET /companies/{company}/employee-progress?search=&course_id=&per_page=&page=
export async function getEmployeeProgress(companyId, params, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employee-progress`, { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load employee progress.");
  }
}

// GET /companies/{company}/employee-progress/{employee}
export async function getEmployeeProgressDetail(companyId, employeeId, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/employee-progress/${employeeId}`, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not load this employee's progress.");
  }
}

// PATCH /companies/{company}/course-assignments/{assignment}/status
export async function updateCourseAssignmentStatus(companyId, assignmentId, status, token) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/course-assignments/${assignmentId}/status`, { status }, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not update this assignment's status.");
  }
}

// GET /companies/{company}/course-assignments?search=&course_id=&status=&per_page=&page=
// Response shape: { success, message, data: { data: [...assignments], pagination: {...} } }
export async function getCourseAssignments(companyId, params, token) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/course-assignments`, { headers: authHeaders(token), params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (error) {
    throw toApiError(error, "Could not load course assignments.");
  }
}

// POST /companies/{company}/batches/{batch}/course-assignments — assigns the
// course to every currently-enrolled member of the batch in one call.
export async function assignCourseToBatch(companyId, batchId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/batches/${batchId}/course-assignments`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not assign this course to the batch.");
  }
}

// POST /companies/{company}/course-assignments
export async function createCourseAssignment(companyId, payload, token) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/course-assignments`, payload, { headers: authHeaders(token) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw toApiError(error, "Could not assign this course.");
  }
}
