import httpClient, { toApiError } from "./axios.js";

// GET /companies/{company}/reports/courses
export async function getCourseReport(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/courses`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load the course report.");
  }
}

// GET /companies/{company}/reports/employees?department_id=
export async function getEmployeeReport(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/employees`, { params });
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load the employee report.");
  }
}

// GET /companies/{company}/reports/completion
export async function getCompletionReport(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/completion`);
    return res.data?.data ?? { overall: {}, by_batch: [] };
  } catch (err) {
    throw toApiError(err, "Could not load the completion report.");
  }
}
