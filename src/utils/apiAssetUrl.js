// The API returns storage paths (e.g. "/storage/companies/logos/logo.png")
// relative to the Laravel origin, not the Vite dev/build origin, and not
// necessarily under the /api prefix — so this strips /api off VITE_API_URL
// to get the origin those paths should be resolved against.
const API_URL = import.meta.env.VITE_API_URL ?? "";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export function resolveApiAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
