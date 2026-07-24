import { EMAIL_REGEX, MOBILE_REGEX, USERNAME_REGEX, PINCODE_REGEX, req, passwordStrength } from "../../utils/formValidators.js";
import { TAKEN_EMAILS, TAKEN_USERNAMES } from "./employeeFormData.js";

export { passwordStrength };

export function validateEmployeeDetails(data, { requireCompany }) {
  const errors = {};
  if (requireCompany) errors.companyId = req(data.companyId, "Company is required.");
  errors.branchId = req(data.branchId, "Branch is required.");
  errors.departmentId = req(data.departmentId, "Department is required.");
  errors.designation = req(data.designation, "Designation is required.");
  errors.firstName = req(data.firstName, "First name is required.");
  errors.lastName = req(data.lastName, "Last name is required.");

  errors.email =
    req(data.email, "Email is required.") ||
    (!EMAIL_REGEX.test(data.email) ? "Enter a valid email address." : null) ||
    (TAKEN_EMAILS.includes(data.email.toLowerCase()) ? "This email is already in use." : null);

  errors.mobile = req(data.mobile, "Mobile number is required.") || (!MOBILE_REGEX.test(data.mobile) ? "Enter a valid mobile number." : null);

  errors.username =
    req(data.username, "Username is required.") ||
    (!USERNAME_REGEX.test(data.username) ? "3-32 characters: letters, numbers, dot, underscore, hyphen." : null) ||
    (TAKEN_USERNAMES.includes(data.username.toLowerCase()) ? "This username is already taken." : null);

  errors.password = req(data.password, "Password is required.") || (passwordStrength(data.password).score < 3 ? "Password is too weak." : null);
  errors.confirmPassword =
    req(data.confirmPassword, "Please confirm the password.") || (data.confirmPassword !== data.password ? "Passwords do not match." : null);

  Object.keys(errors).forEach((k) => errors[k] === null && delete errors[k]);
  return errors;
}

function validateAddress(data) {
  const errors = {};
  errors.line1 = req(data.line1, "Address line 1 is required.");
  errors.country = req(data.country, "Country is required.");
  errors.state = req(data.state, "State is required.");
  errors.city = req(data.city, "City is required.");
  errors.pincode = req(data.pincode, "Pincode is required.") || (!PINCODE_REGEX.test(data.pincode) ? "Enter a valid pincode." : null);
  Object.keys(errors).forEach((k) => errors[k] === null && delete errors[k]);
  return errors;
}

// Only the current address is required — the permanent address fields have
// no "*" in the spec, so it stays optional even when "Same as Current" is off.
export function validateAddressStep(addressState) {
  return { current: validateAddress(addressState.current) };
}

export function validateDocuments(rows) {
  const rowErrors = {};
  rows.forEach((row) => {
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
