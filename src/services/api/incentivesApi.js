import httpClient, { toApiError } from "../axios.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/monthly-incentives?status=&period=YYYY-MM
export async function getCompanyIncentives(companyId, params = {}) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/monthly-incentives`, { params });
    const body = res.data?.data ?? res.data;
    return { items: body?.data ?? [], pagination: { ...DEFAULT_PAGINATION, ...body?.pagination } };
  } catch (err) {
    throw toApiError(err, "Could not load incentives.");
  }
}

// PATCH /companies/{company}/monthly-incentives/{monthlyIncentive}/status
export async function updateIncentiveStatus(companyId, incentiveId, status) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/monthly-incentives/${incentiveId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update the incentive status.");
  }
}

// GET /companies/{company}/my-incentives
export async function getMyIncentives(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-incentives`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load your incentives.");
  }
}
