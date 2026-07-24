// Mock auth backend. No real API exists yet — this mirrors the exact
// response envelope the real login endpoint will return, so swapping this
// function for `axios.post("/api/login", credentials)` later is a one-line
// change; nothing that consumes it (AuthContext) needs to know the
// difference.

const SUPER_ADMIN_PERMISSIONS = [
  "users.view", "users.create", "users.edit", "users.delete",
  "roles.view", "roles.create", "roles.edit", "roles.delete",
  "permissions.view", "permissions.assign",
  "companies.view", "companies.create", "companies.edit", "companies.delete",
  "branches.view", "branches.create", "branches.edit", "branches.delete",
  "departments.view", "departments.create", "departments.edit", "departments.delete",
  "designations.view", "designations.create", "designations.edit", "designations.delete",
  "subscriptions.view", "subscriptions.create", "subscriptions.edit",
  "subscription_plans.view", "subscription_plans.create", "subscription_plans.edit", "subscription_plans.delete",
  "employees.view", "employees.create", "employees.edit", "employees.delete", "employees.leave",
  "trainers.view", "trainers.create", "trainers.edit", "trainers.delete",
  "course_categories.view", "course_categories.create", "course_categories.edit", "course_categories.delete",
  "courses.view", "courses.create", "courses.edit", "courses.delete", "courses.publish", "courses.assign",
  "lessons.view", "lessons.create", "lessons.edit", "lessons.delete", "lessons.access",
  "batches.view", "batches.create", "batches.edit", "batches.delete",
  "training_sessions.view", "training_sessions.create", "training_sessions.edit", "training_sessions.delete",
  "attendance.view", "attendance.mark", "attendance.edit",
  "training_materials.view", "training_materials.upload", "training_materials.delete",
  "training_feedback.view", "training_feedback.submit",
  "assessments.view", "assessments.create", "assessments.edit", "assessments.delete", "assessments.attempt", "assessments.evaluate",
  "assignments.view", "assignments.create", "assignments.edit", "assignments.delete", "assignments.submit", "assignments.evaluate",
  "certificates.view", "certificates.issue", "certificates.revoke", "certificates.download",
  "certificate_templates.view", "certificate_templates.create", "certificate_templates.edit",
  "performance_reviews.view", "performance_reviews.create", "performance_reviews.edit",
  "trainer_performance.view", "trainer_performance.create",
  "reports.training", "reports.assessment", "reports.certification", "reports.attendance", "reports.performance", "reports.trainer",
  "notifications.view", "notifications.manage", "notifications.send",
  "settings.view", "settings.edit",
  "audit_logs.view",
  "master_data.view", "master_data.manage",
];

const COMPANY_ADMIN_PERMISSIONS = [
  "companies.view", "companies.edit",
  "branches.view", "branches.create", "branches.edit",
  "departments.view", "departments.create", "departments.edit",
  "designations.view", "designations.create", "designations.edit",
  "employees.view", "employees.create", "employees.edit", "employees.delete", "employees.leave",
  "trainers.view", "trainers.create", "trainers.edit",
  "course_categories.view", "course_categories.create", "course_categories.edit",
  "courses.view", "courses.create", "courses.edit", "courses.publish", "courses.assign",
  "lessons.view", "lessons.create", "lessons.edit",
  "batches.view", "batches.create", "batches.edit",
  "training_sessions.view", "training_sessions.create", "training_sessions.edit",
  "attendance.view", "attendance.mark",
  "training_materials.view", "training_materials.upload",
  "assessments.view", "assessments.create", "assessments.edit",
  "assignments.view", "assignments.create", "assignments.edit",
  "certificates.view", "certificates.issue",
  "reports.training", "reports.assessment", "reports.certification", "reports.attendance", "reports.performance", "reports.trainer",
  "notifications.view", "notifications.manage",
  "settings.view",
];

const TRAINER_PERMISSIONS = [
  "courses.view",
  "lessons.view", "lessons.access",
  "training_sessions.view", "training_sessions.create", "training_sessions.edit",
  "attendance.view", "attendance.mark",
  "training_materials.view", "training_materials.upload",
  "assessments.view", "assessments.create", "assessments.edit", "assessments.evaluate",
  "assignments.view", "assignments.create", "assignments.edit", "assignments.evaluate",
  "trainer_performance.view",
  "reports.training", "reports.attendance",
];

const SALES_MANAGER_PERMISSIONS = [
  "employees.view",
  "reports.performance",
  "notifications.view",
];

const SALES_EMPLOYEE_PERMISSIONS = [
  "courses.view",
  "lessons.view", "lessons.access",
  "assessments.view", "assessments.attempt",
  "assignments.view", "assignments.submit",
  "certificates.view", "certificates.download",
  "notifications.view",
];

// Keyed by the username a demo login would use. In the real system this
// lookup + password check happens server-side.
const MOCK_USERS = {
  superadmin: {
    id: 1,
    name: "Super Admin",
    username: "superadmin",
    email: "itinfra@glansa.in",
    mobile: null,
    profile_image: null,
    email_verified: true,
    status: "Active",
    last_login: "2026-07-23T12:10:46.000000Z",
    role: { id: 1, name: "Super Admin" },
    permissions: SUPER_ADMIN_PERMISSIONS,
    company: null,
  },
  companyadmin: {
    id: 2,
    name: "Priya Nair",
    username: "companyadmin",
    email: "priya.nair@company.com",
    mobile: null,
    profile_image: null,
    email_verified: true,
    status: "Active",
    last_login: null,
    role: { id: 2, name: "Company Admin" },
    permissions: COMPANY_ADMIN_PERMISSIONS,
    company: { id: 1, name: "Glansa Sales" },
  },
  trainer: {
    id: 3,
    name: "Robert Jackson",
    username: "trainer",
    email: "robert.jackson@company.com",
    mobile: null,
    profile_image: null,
    email_verified: true,
    status: "Active",
    last_login: null,
    role: { id: 3, name: "Trainer" },
    permissions: TRAINER_PERMISSIONS,
    company: { id: 1, name: "Glansa Sales" },
  },
  salesmanager: {
    id: 4,
    name: "Marcus Thorne",
    username: "salesmanager",
    email: "marcus.thorne@company.com",
    mobile: null,
    profile_image: null,
    email_verified: true,
    status: "Active",
    last_login: null,
    role: { id: 4, name: "Sales Manager" },
    permissions: SALES_MANAGER_PERMISSIONS,
    company: { id: 1, name: "Glansa Sales" },
  },
  salesemployee: {
    id: 5,
    name: "Jessica Wang",
    username: "salesemployee",
    email: "jessica.wang@company.com",
    mobile: null,
    profile_image: null,
    email_verified: true,
    status: "Active",
    last_login: null,
    role: { id: 5, name: "Sales Employee" },
    permissions: SALES_EMPLOYEE_PERMISSIONS,
    company: { id: 1, name: "Glansa Sales" },
  },
};

function mockToken() {
  return Array.from({ length: 64 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
}

export function login({ username }) {
  const key = String(username ?? "").trim().toLowerCase();
  const user = MOCK_USERS[key] ?? Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === key);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!user) {
        reject({ success: false, message: "Invalid username or password." });
        return;
      }
      resolve({
        success: true,
        message: "Login successful.",
        data: { token: mockToken(), token_type: "Bearer", user },
      });
    }, 400);
  });
}

export const DEMO_ACCOUNTS = Object.values(MOCK_USERS).map((u) => ({ username: u.username, roleName: u.role.name }));
