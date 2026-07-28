export const GENDERS = ["Male", "Female", "Other"];
export const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Intern"];
export const EMPLOYEE_STATUSES = ["Active", "Inactive", "Resigned", "Terminated"];

export const DOCUMENT_TYPES = ["ID Proof", "Address Proof", "Educational Certificate", "Offer Letter", "Resume", "Other"];
export const VERIFICATION_STATUSES = ["Pending", "Verified", "Rejected"];

export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
