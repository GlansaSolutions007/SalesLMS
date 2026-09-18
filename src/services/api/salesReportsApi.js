import httpClient, { toApiError } from "../axios.js";

// GET /companies/{company}/reports/sales/employee-performance
export async function getEmployeePerformanceReport(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/employee-performance`);
    return res.data?.data ?? { overall: {}, by_employee: [] };
  } catch (err) {
    throw toApiError(err, "Could not load the employee performance report.");
  }
}

// GET /companies/{company}/reports/sales/lead-conversion
export async function getLeadConversionReport(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/lead-conversion`);
    return res.data?.data ?? { overall: {}, by_status: [] };
  } catch (err) {
    throw toApiError(err, "Could not load the lead conversion report.");
  }
}

// GET /companies/{company}/reports/sales/target-achievement?period=YYYY-MM
export async function getTargetAchievementReport(companyId, period) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/target-achievement`, { params: period ? { period } : {} });
    return res.data?.data ?? { overall: {}, by_employee: [] };
  } catch (err) {
    throw toApiError(err, "Could not load the target achievement report.");
  }
}

// GET /companies/{company}/reports/sales/incentives?period=YYYY-MM
export async function getIncentiveReport(companyId, period) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/incentives`, { params: period ? { period } : {} });
    return res.data?.data ?? { overall: {}, by_employee: [] };
  } catch (err) {
    throw toApiError(err, "Could not load the incentive report.");
  }
}

// GET /companies/{company}/reports/sales/revenue?from=&to=
export async function getRevenueReport(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/revenue`, { params });
    return res.data?.data ?? { overall: {}, by_employee: [] };
  } catch (err) {
    throw toApiError(err, "Could not load the revenue report.");
  }
}

// GET /companies/{company}/reports/sales/employee-target-performance
// params: employee_id, sales_team_id, target_type, period, month, quarter,
// year, date_from, date_to, status — all optional, see
// EmployeeTargetPerformanceService for exact semantics. The backend is
// authoritative for every date calculation and aggregation here.
export async function getEmployeeTargetPerformanceReport(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/employee-target-performance`, { params });
    return res.data?.data ?? { kpis: {}, by_employee: [], monthly_trend: [], distribution: {}, period: {} };
  } catch (err) {
    throw toApiError(err, "Could not load the employee target performance report.");
  }
}

// GET /companies/{company}/reports/sales/employee-target-performance/export?format=xlsx|csv&...
// Same filters as the report above, plus `format` — returns a blob for the
// caller to save (see downloadBlob in EmployeeTargetPerformance.jsx).
export async function exportEmployeeTargetPerformanceReport(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/reports/sales/employee-target-performance/export`, { params, responseType: "blob" });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not export the employee target performance report.");
  }
}
