import { EMPLOYEES } from "./employeeData.js";

const BRANCH_NAMES = ["Head Office", "North Zone Branch", "South Zone Branch"];
const DEPARTMENT_NAMES = ["Sales", "Marketing", "Support", "HR", "Finance", "Operations"];
const DESIGNATION_NAMES = ["Executive", "Senior Executive", "Team Lead", "Manager", "Senior Manager", "Director", "Intern"];

// Branch loads from Company; Department loads from Branch; Designation loads
// from Company. There's no real Branches/Departments/Designations API yet,
// so these generate the same mock set for whichever company is actually
// selected (now real companies from the API, not a fixed mock id range) —
// keeps the cascade functionally alive instead of going empty for every
// company id the mock data didn't happen to predefine.
export function getBranchesForCompany(companyId) {
  if (!companyId) return [];
  return BRANCH_NAMES.map((name, i) => ({ id: `${companyId}-branch-${i + 1}`, name }));
}

export function getDepartmentsForBranch(branchId) {
  if (!branchId) return [];
  return DEPARTMENT_NAMES;
}

export function getDesignationsForCompany(companyId) {
  if (!companyId) return [];
  return DESIGNATION_NAMES;
}

export const GENDERS = ["Male", "Female", "Other"];
export const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Intern"];
export const EMPLOYEE_STATUSES = ["Active", "Inactive", "Resigned", "Terminated"];

export const DOCUMENT_TYPES = ["ID Proof", "Address Proof", "Educational Certificate", "Offer Letter", "Resume", "Other"];
export const VERIFICATION_STATUSES = ["Pending", "Verified", "Rejected"];

export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];

// Demo uniqueness check against the existing seed roster — a real backend
// would check this server-side.
export const TAKEN_EMAILS = EMPLOYEES.map((e) => e.email.toLowerCase());
export const TAKEN_USERNAMES = EMPLOYEES.map((e) => e.name.toLowerCase().replace(/\s+/g, "."));

// No "employees by company" API exists yet, so this offers the same mock
// roster as candidate reporting managers once any company is selected.
export function getReportingManagers(companyId) {
  return companyId ? EMPLOYEES : [];
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function generateEmployeeCode() {
  const next = EMPLOYEES.length + 1000 + 1;
  return `EMP-${next}`;
}

export function emptyDocumentRow() {
  return {
    id: uid("doc"),
    type: DOCUMENT_TYPES[0],
    number: "",
    expiryDate: "",
    verificationStatus: "Pending",
    file: null,
    fileName: "",
  };
}

export function emptySkillRow() {
  return { id: uid("skill"), name: "", level: SKILL_LEVELS[0], experienceYears: "" };
}

export function emptyEmergencyContact() {
  return { id: uid("ec"), name: "", relationship: RELATIONSHIPS[0], mobile: "", email: "", address: "" };
}

export function emptyAddress() {
  return { line1: "", line2: "", country: "", state: "", city: "", pincode: "" };
}
