export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ANALYTICS: "/analytics",
  MY_PROFILE: "/my-profile",

  COMPANY: "/company",
  COMPANY_COMPANIES: "/company/companies",
  COMPANY_ADD: "/company/companies/add",
  COMPANY_VIEW: "/company/view/:id",
  COMPANY_EDIT: "/company/edit/:id",
  COMPANY_BRANCHES: "/company/branches",
  COMPANY_BRANCH_VIEW: "/company/branches/:companyId/:branchId",
  COMPANY_DEPARTMENTS: "/company/departments",
  COMPANY_DEPARTMENT_VIEW: "/company/departments/:companyId/:departmentId",
  COMPANY_DESIGNATIONS: "/company/designations",
  COMPANY_DESIGNATION_VIEW: "/company/designations/:companyId/:designationId",

  EMPLOYEES: "/employees",
  EMPLOYEES_ADD: "/employees/add",
  EMPLOYEES_EDIT: "/employees/edit/:companyId/:employeeId",
  EMPLOYEES_LEAVE: "/employees/leave",
  EMPLOYEE_PROFILE: "/employees/profile/:companyId/:employeeId",

  TRAINERS: "/trainers",
  TRAINERS_BATCHES: "/trainers/batches",
  TRAINER_ADD: "/trainers/add",
  TRAINER_PROFILE: "/trainers/profile",
  TRAINER_EDIT: "/trainers/:id/edit",

  COURSES: "/courses",
  COURSES_CREATE: "/courses/create",
  COURSES_CATEGORIES: "/courses/categories",
  COURSES_MODULES: "/courses/modules",
  COURSES_LESSONS: "/courses/lessons",
  COURSES_RESOURCES: "/courses/resources",

  TRAINING: "/training",
  TRAINING_SESSIONS: "/training/sessions",
  TRAINING_ASSIGN_COURSES: "/training/assign-courses",
  TRAINING_ASSIGN_COURSES_ADD: "/training/assign-courses/add",

  BATCHES: "/batches",
  ASSESSMENTS: "/assessments",
  ASSIGNMENTS: "/assignments",
  CERTIFICATES: "/certificates",
  LEADS: "/leads",
  PIPELINE: "/pipeline",
  SALES: "/sales",
  ACTIVITIES: "/activities",
  REPORTS: "/reports",
  TARGETS: "/targets",
  REWARDS: "/rewards",
  NOTIFICATIONS: "/notifications",
  MASTERS: "/masters",
  MASTERS_SUBSCRIPTIONS: "/masters/subscriptions",
  MASTERS_ROLES: "/masters/roles",
  MASTERS_ROLE_PERMISSIONS: "/masters/roles/:roleId/permissions",
  SETTINGS: "/settings",
  AUDIT: "/audit",
};

export function companyViewPath(id) {
  return ROUTES.COMPANY_VIEW.replace(":id", id);
}

export function companyEditPath(id) {
  return ROUTES.COMPANY_EDIT.replace(":id", id);
}

export function companyBranchViewPath(companyId, branchId) {
  return ROUTES.COMPANY_BRANCH_VIEW.replace(":companyId", companyId).replace(":branchId", branchId);
}

export function companyDepartmentViewPath(companyId, departmentId) {
  return ROUTES.COMPANY_DEPARTMENT_VIEW.replace(":companyId", companyId).replace(":departmentId", departmentId);
}

export function companyDesignationViewPath(companyId, designationId) {
  return ROUTES.COMPANY_DESIGNATION_VIEW.replace(":companyId", companyId).replace(":designationId", designationId);
}

export function rolePermissionsPath(roleId) {
  return ROUTES.MASTERS_ROLE_PERMISSIONS.replace(":roleId", roleId);
}

export function employeeEditPath(companyId, employeeId) {
  return ROUTES.EMPLOYEES_EDIT.replace(":companyId", companyId).replace(":employeeId", employeeId);
}

export function employeeProfilePath(companyId, employeeId) {
  return ROUTES.EMPLOYEE_PROFILE.replace(":companyId", companyId).replace(":employeeId", employeeId);
}
