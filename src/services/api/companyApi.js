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
