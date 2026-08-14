import httpClient, { toApiError } from "./axios.js";

// GET /admin/system-settings
export async function getSystemSettings() {
  try {
    const res = await httpClient.get("/admin/system-settings");
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load system settings.");
  }
}

// PUT /admin/system-settings — payload: [{ setting_key, setting_value }, ...]
export async function updateSystemSettings(settings) {
  try {
    const res = await httpClient.put("/admin/system-settings", { settings });
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not save system settings.");
  }
}
