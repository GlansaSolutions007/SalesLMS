import { exportToCsv, parseCsv } from "../../../utils/csv.js";
import { EMAIL_REGEX, MOBILE_REGEX, req, passwordStrength } from "../../../utils/formValidators.js";

// Column headers for both the sample template and the parsed upload — kept
// as one list so "what the template says" and "what we read back" can never
// drift apart. Deliberately NO Company/Company ID/Company Name column: the
// company always comes from the authenticated Company Admin's own
// company_id (or, for Super Admin, whichever company's Employees page this
// was opened from) — never from the file. There's also no "Username"
// column: EmployeeController::store() has no username input at all, the
// login account's username is always set to the employee's email — showing
// a separate Username field here would silently do nothing and mislead
// whoever fills the template. Role and Status ARE included (the task spec
// asks for them) but are validated against the single fixed value the
// backend actually produces (StoreEmployeeRequest/EmployeeController::store()
// hardcode the new employee to the "Employee" role and "Active" status —
// neither is a real input on that endpoint), so the template documents the
// real behavior rather than implying a choice that would be silently
// ignored.
export const EMPLOYEE_IMPORT_COLUMNS = [
  { key: "employee_code", header: "Employee ID", required: false },
  { key: "name", header: "Name", required: true },
  { key: "email", header: "Email", required: true },
  { key: "mobile", header: "Mobile", required: true },
  { key: "password", header: "Password", required: true },
  { key: "confirm_password", header: "Confirm Password", required: true },
  { key: "role", header: "Role", required: false },
  { key: "status", header: "Status", required: false },
];

const SAMPLE_ROWS = [
  { employee_code: "EMP001", name: "John Sales", email: "john.sales@example.com", mobile: "9876543210", password: "Password@123", confirm_password: "Password@123", role: "Employee", status: "Active" },
  { employee_code: "EMP002", name: "Priya Sales", email: "priya.sales@example.com", mobile: "9876543211", password: "Password@123", confirm_password: "Password@123", role: "Employee", status: "Active" },
  { employee_code: "", name: "Arjun Kumar", email: "arjun.kumar@example.com", mobile: "9876543212", password: "Password@123", confirm_password: "Password@123", role: "Employee", status: "Active" },
];

export function downloadEmployeeImportSample() {
  exportToCsv("employee-bulk-upload-sample.csv", SAMPLE_ROWS, EMPLOYEE_IMPORT_COLUMNS);
}

// The parsed CSV's header row (from parseCsv, which keys each row object by
// whatever's in the header row of the uploaded file) won't necessarily
// match our column `key`s — this re-keys by matching each of our known
// headers case-insensitively against whatever header text is actually in
// the file, so a template edited by hand (extra spaces, different casing)
// still parses.
function normalizeRow(rawRow) {
  const lowerKeyed = Object.fromEntries(Object.entries(rawRow).map(([k, v]) => [k.trim().toLowerCase(), String(v ?? "").trim()]));
  const out = {};
  EMPLOYEE_IMPORT_COLUMNS.forEach((col) => {
    out[col.key] = lowerKeyed[col.header.toLowerCase()] ?? lowerKeyed[col.key] ?? "";
  });
  return out;
}

export function parseEmployeeImportFile(text) {
  return parseCsv(text).map(normalizeRow);
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

// Validates one row against exactly the same rules employeeFormValidation.js
// applies to the single Add Employee form (same regexes, same password
// strength gate) — "follow the existing employee creation rules" per spec,
// not a second set of rules invented for bulk upload. `seenEmails`/
// `seenCodes` catch duplicates WITHIN the uploaded file itself; a duplicate
// against the database (another company's employee doesn't collide, but an
// existing email in this same company does) can only be detected when the
// row is actually submitted to the real create-employee API during import —
// see BulkUploadEmployeesModal's import step, which surfaces that as a
// per-row error the same way this preview does.
export function validateImportRows(rows) {
  const seenEmails = new Set();
  const seenCodes = new Set();

  return rows.map((row, index) => {
    const errors = [];

    const nameError = req(row.name, "Name is required.");
    if (nameError) errors.push(nameError);

    const emailError = req(row.email, "Email is required.") || (!EMAIL_REGEX.test(row.email) ? "Enter a valid email address." : null);
    if (emailError) errors.push(emailError);
    else {
      const emailLower = row.email.toLowerCase();
      if (seenEmails.has(emailLower)) errors.push("Duplicate email within this file.");
      seenEmails.add(emailLower);
    }

    const mobileError = req(row.mobile, "Mobile number is required.") || (!MOBILE_REGEX.test(row.mobile) ? "Enter a valid mobile number." : null);
    if (mobileError) errors.push(mobileError);

    const passwordError = req(row.password, "Password is required.") || (passwordStrength(row.password).score < 3 ? "Password is too weak." : null);
    if (passwordError) errors.push(passwordError);
    else if (row.confirm_password !== row.password) errors.push("Password and Confirm Password do not match.");

    if (row.employee_code) {
      const codeLower = row.employee_code.toLowerCase();
      if (seenCodes.has(codeLower)) errors.push("Duplicate Employee ID within this file.");
      seenCodes.add(codeLower);
    }

    // Role/Status are fixed by the backend (see column comment above) — flag
    // anything else so the admin isn't misled into thinking a different
    // value here would take effect.
    if (row.role && row.role.toLowerCase() !== "employee") {
      errors.push('Role must be "Employee" — this is the only role bulk-created employees can have.');
    }
    if (row.status && row.status.toLowerCase() !== "active") {
      errors.push('Status must be "Active" — new employees are always created Active.');
    }

    return { row: index + 2, data: row, errors }; // +2: header row is line 1, data starts at line 2
  });
}

// Employee code/name/email/mobile/password only — company_id is never part
// of this payload. It's supplied purely via the URL the caller posts to
// (createCompanyEmployee(companyId, ...)), which is always the authenticated
// Company Admin's own company (or, for a Super Admin, whichever company's
// Employees page this modal was opened from) — see BulkUploadEmployeesModal.
export function buildEmployeeImportFormData(row) {
  const { firstName, lastName } = splitName(row.name);
  const fd = new FormData();
  if (row.employee_code) fd.append("employee_code", row.employee_code);
  fd.append("first_name", firstName);
  if (lastName) fd.append("last_name", lastName);
  fd.append("email", row.email);
  fd.append("mobile", row.mobile);
  fd.append("create_login", "1");
  fd.append("login_password", row.password);
  return fd;
}
