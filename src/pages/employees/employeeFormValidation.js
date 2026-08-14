import { EMAIL_REGEX, MOBILE_REGEX, PINCODE_REGEX, req, passwordStrength } from "../../utils/formValidators.js";

export { passwordStrength };

// Optional numeric field — only complains when something non-numeric was
// typed, never for being blank (none of these targets are mandatory).
function optionalNumeric(value, message) {
  if (String(value ?? "").trim() === "") return null;
  return Number.isFinite(Number(value)) ? null : message;
}

export function validateEmployeeDetails(data, { requireCompany }) {
  const errors = {};
  if (requireCompany) errors.companyId = req(data.companyId, "Company is required.");
  errors.branchId = req(data.branchId, "Branch is required.");
  errors.designationId = req(data.designationId, "Designation is required.");
  errors.firstName = req(data.firstName, "First name is required.");
  errors.lastName = req(data.lastName, "Last name is required.");

  errors.email =
    req(data.email, "Email is required.") || (!EMAIL_REGEX.test(data.email) ? "Enter a valid email address." : null);

  errors.mobile = req(data.mobile, "Mobile number is required.") || (!MOBILE_REGEX.test(data.mobile) ? "Enter a valid mobile number." : null);

  // A portal login is always created for new employees, matching the backend's
  // `login_password` => required_if:create_login,true.
  if (data.createLogin) {
    errors.password = req(data.password, "Password is required.") || (passwordStrength(data.password).score < 3 ? "Password is too weak." : null);
    errors.confirmPassword =
      req(data.confirmPassword, "Please confirm the password.") || (data.confirmPassword !== data.password ? "Passwords do not match." : null);
  }

  errors.monthlyLeadTarget = optionalNumeric(data.monthlyLeadTarget, "Monthly Lead Target must be a number.");
  errors.monthlySalesTarget = optionalNumeric(data.monthlySalesTarget, "Monthly Sales Target must be a number.");
  errors.monthlyRevenueTarget = optionalNumeric(data.monthlyRevenueTarget, "Monthly Revenue Target must be a number.");

  if (String(data.commissionPercentage ?? "").trim() !== "") {
    const pct = Number(data.commissionPercentage);
    errors.commissionPercentage = !Number.isFinite(pct)
      ? "Commission Percentage must be a number."
      : pct < 0 || pct > 100
      ? "Commission Percentage must be between 0 and 100."
      : null;
  }

  Object.keys(errors).forEach((k) => errors[k] === null && delete errors[k]);
  return errors;
}

export function validateAddressStep(data) {
  const errors = {};
  errors.line1 = req(data.line1, "Address line 1 is required.");
  errors.country = req(data.country, "Country is required.");
  errors.state = req(data.state, "State is required.");
  errors.city = req(data.city, "City is required.");
  errors.pincode = req(data.pincode, "Pincode is required.") || (!PINCODE_REGEX.test(data.pincode) ? "Enter a valid pincode." : null);
  Object.keys(errors).forEach((k) => errors[k] === null && delete errors[k]);
  return errors;
}

export function validateDocuments(rows) {
  const rowErrors = {};
  rows.forEach((row) => {
    if (row.persisted) return; // already saved server-side, nothing to validate
    const errs = {};
    if (row.fileName && !row.number.trim()) errs.number = "Document number is required.";
    if (row.number.trim() && !row.fileName) errs.file = "Please upload a file for this document.";
    if (Object.keys(errs).length) rowErrors[row.id] = errs;
  });
  return rowErrors;
}

// Step 3 (Skills & Emergency Contact) has no mandatory fields per spec.
export function validateSkillsStep() {
  return {};
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
