import httpClient, { toApiError } from "./axios.js";

// GET /admin/dashboard — role-specific stats for whoever is logged in.
// The backend branches on the authenticated user's role and returns a
// different payload shape per role (see DashboardController@index).
export async function getDashboard() {
  try {
    const res = await httpClient.get("/admin/dashboard");
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load dashboard data.");
  }
}
