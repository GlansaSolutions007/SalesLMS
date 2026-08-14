// The API returns storage paths (e.g. "/storage/companies/logos/logo.png")
// relative to the Laravel origin, not the Vite dev/build origin, and not
// necessarily under the /api prefix — so this strips /api off
// REACT_VITE_API_URL to get the origin those paths should be resolved
// against. Must match the var axios.js reads (REACT_VITE_API_URL, set in
// .env) — VITE_API_URL is never defined there, which silently broke every
// resolved asset URL (thumbnails, logos, resources) app-wide.
const API_URL = import.meta.env.REACT_VITE_API_URL ?? "";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export function resolveApiAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  // Every controller that stores a file (course thumbnails, company logos,
  // lesson resources, editor uploads) saves the raw path Storage::store()
  // returns — disk-relative, e.g. "companies/logos/x.png" — with no
  // "storage/" prefix. The public disk only serves files under /storage
  // (via the storage:link symlink), so that prefix has to be added here;
  // without it every resolved URL 404s one directory short of the file.
  const relative = path.startsWith("/") ? path.slice(1) : path;
  const withStoragePrefix = relative.startsWith("storage/") ? relative : `storage/${relative}`;
  return `${API_ORIGIN}/${withStoragePrefix}`;
}
