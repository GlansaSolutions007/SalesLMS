import { COMPANIES } from "../company/companyData.js";
import { EMPLOYEES } from "./employeeData.js";

const BRANCH_NAMES = ["Head Office", "North Zone Branch", "South Zone Branch"];
const DEPARTMENT_NAMES = ["Sales", "Marketing", "Support", "HR", "Finance", "Operations"];
const DESIGNATION_NAMES = ["Executive", "Senior Executive", "Team Lead", "Manager", "Senior Manager", "Director", "Intern"];

// Branch loads from Company; Department loads from Branch; Designation loads
// from Company. This mock data mirrors those three cascades for every seed
// company so the dropdowns behave correctly regardless of which company a
// Super Admin picks.
export const BRANCHES_BY_COMPANY = Object.fromEntries(
  COMPANIES.map((company) => [
    company.id,
    BRANCH_NAMES.map((name, i) => ({ id: `${company.id}-branch-${i + 1}`, name })),
  ])
);

export const DEPARTMENTS_BY_BRANCH = Object.fromEntries(
  Object.values(BRANCHES_BY_COMPANY)
    .flat()
    .map((branch) => [branch.id, DEPARTMENT_NAMES])
);

export const DESIGNATIONS_BY_COMPANY = Object.fromEntries(COMPANIES.map((company) => [company.id, DESIGNATION_NAMES]));

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

// Only company id 1 has seed employees in this mock dataset, so that's the
// only company with reporting-manager options to offer.
export function getReportingManagers(companyId) {
  return companyId === 1 ? EMPLOYEES : [];
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
