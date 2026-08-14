import httpClient, { toApiError } from "../axios.js";

// GET /companies/{company}/sales-teams
export async function getSalesTeams(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/sales-teams`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load sales teams.");
  }
}

// GET /companies/{company}/sales-teams/{salesTeam}
export async function getSalesTeam(companyId, teamId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/sales-teams/${teamId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this sales team.");
  }
}

// POST /companies/{company}/sales-teams
export async function createSalesTeam(companyId, payload) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/sales-teams`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create this sales team.");
  }
}

// PUT /companies/{company}/sales-teams/{salesTeam}
export async function updateSalesTeam(companyId, teamId, payload) {
  try {
    const res = await httpClient.put(`/companies/${companyId}/sales-teams/${teamId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update this sales team.");
  }
}

// PATCH /companies/{company}/sales-teams/{salesTeam}/status
export async function updateSalesTeamStatus(companyId, teamId, status) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/sales-teams/${teamId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update the team status.");
  }
}

// DELETE /companies/{company}/sales-teams/{salesTeam}
export async function deleteSalesTeam(companyId, teamId) {
  try {
    await httpClient.delete(`/companies/${companyId}/sales-teams/${teamId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete this sales team.");
  }
}

// POST /companies/{company}/sales-teams/{salesTeam}/members — { employee_ids: [] }
export async function addSalesTeamMembers(companyId, teamId, employeeIds) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/sales-teams/${teamId}/members`, { employee_ids: employeeIds });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not add members to this team.");
  }
}

// PATCH /companies/{company}/sales-teams/{salesTeam}/members/{member}
export async function updateSalesTeamMember(companyId, teamId, memberId, status) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/sales-teams/${teamId}/members/${memberId}`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update this member.");
  }
}

// DELETE /companies/{company}/sales-teams/{salesTeam}/members/{member}
export async function removeSalesTeamMember(companyId, teamId, memberId) {
  try {
    await httpClient.delete(`/companies/${companyId}/sales-teams/${teamId}/members/${memberId}`);
  } catch (err) {
    throw toApiError(err, "Could not remove this member.");
  }
}
