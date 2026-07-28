// Kept in sync with the backend's validation (mimes:pdf,jpg,jpeg,png, max:5120)
// in EmployeeDocumentController::store — accepting anything wider here would
// just mean a guaranteed 422 on upload.
export const ACCEPTED_DOCUMENT_TYPES = [".pdf", ".png", ".jpg", ".jpeg"];
export const ACCEPTED_DOCUMENT_MIME = ["application/pdf", "image/png", "image/jpeg"];
export const MAX_DOCUMENT_SIZE_MB = 5;
