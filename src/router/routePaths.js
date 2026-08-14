export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ANALYTICS: "/analytics",
  MY_PROFILE: "/my-profile",
  MY_LEARNING: "/my-learning",
  MY_LEARNING_COURSE: "/my-learning/:courseId",
  MY_CERTIFICATES: "/my-certificates",
  MY_CERTIFICATE_VIEW: "/my-certificates/:certificateId",
  SUBSCRIPTION_EXPIRED: "/subscription-expired",

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
  COMPANY_ADMINS: "/company/admins",
  COMPANY_DOCUMENTS: "/company/documents",
  // Company Admin's own company (no :id — resolved from the logged-in user),
  // distinct from COMPANY_VIEW/COMPANY_EDIT which browse any company by id
  // from the Super-Admin-only companies list.
  COMPANY_PROFILE: "/company/profile",
  COMPANY_PROFILE_EDIT: "/company/profile/edit",

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
  COURSES_ASSIGNMENTS: "/courses/assignments",
  ASSIGNMENT_SUBMISSIONS: "/courses/assignments/:assignmentId/submissions",
  COURSES_ASSESSMENTS: "/courses/assessments",
  COURSES_ASSESSMENTS_ADD: "/courses/assessments/add",
  COURSES_ASSESSMENTS_EDIT: "/courses/assessments/:id/edit",
  COURSE_VIEW: "/courses/view/:id",
  LESSON_VIEW: "/courses/:courseId/modules/:moduleId/lessons/:lessonId",

  TRAINING: "/training",
  TRAINING_SESSIONS: "/training/sessions",
  TRAINING_ASSIGN_COURSES: "/training/assign-courses",
  TRAINING_ASSIGN_COURSES_ADD: "/training/assign-courses/add",
  TRAINING_EMPLOYEE_PROGRESS: "/training/employee-progress",

  BATCHES: "/batches",
  BATCHES_ADD: "/batches/add",
  BATCHES_EDIT: "/batches/edit/:companyId/:batchId",
  ASSESSMENTS: "/assessments",
  ASSESSMENT_ATTEMPTS: "/assessments/:assessmentId/attempts",
  ASSIGNMENTS: "/assignments",
  CERTIFICATES: "/certificates",
  // Landing path for the "Sales Performance" sidebar group (Leads/Target/
  // Incentives) — only used when the sidebar is collapsed and the group
  // icon is clicked directly; expanded it's an accordion with no page of
  // its own, same as Training/Masters.
  SALES_PERFORMANCE: "/sales-performance",
  LEADS: "/leads",
  LEADS_ADD: "/leads/add",
  LEAD_VIEW: "/leads/view/:companyId/:leadId",
  MY_LEADS: "/my-leads",
  MY_LEAD_VIEW: "/my-leads/:leadId",
  ASSIGN_LEADS: "/assign-leads",
  FOLLOWUPS: "/follow-ups",
  PIPELINE: "/pipeline",
  SALES: "/sales",
  ACTIVITIES: "/activities",
  REPORTS: "/reports",
  TARGETS: "/targets",
  TARGETS_ADD: "/targets/add",
  TARGETS_EDIT: "/targets/edit/:companyId/:targetId",
  REWARDS: "/rewards",
  NOTIFICATIONS: "/notifications",
  MASTERS: "/masters",
  MASTERS_SUBSCRIPTIONS: "/masters/subscriptions",
  MASTERS_ALL_SUBSCRIPTIONS: "/masters/all-subscriptions",
  MASTERS_EXPIRED_SUBSCRIPTIONS: "/masters/expired-subscriptions",
  MASTERS_RENEWAL_REQUESTS: "/masters/renewal-requests",
  MASTERS_RENEWAL_REQUEST_VIEW: "/masters/renewal-requests/:id",
  MASTERS_ROLES: "/masters/roles",
  MASTERS_ROLE_PERMISSIONS: "/masters/roles/:roleId/permissions",
  MASTERS_PERMISSIONS: "/masters/permissions",
  MASTERS_CERTIFICATE_TEMPLATES: "/masters/certificate-templates",
  MASTERS_CERTIFICATE_TEMPLATES_ADD: "/masters/certificate-templates/add",
  MASTERS_CERTIFICATE_TEMPLATES_EDIT: "/masters/certificate-templates/:id/edit",
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

export function certificateTemplateEditPath(id) {
  return ROUTES.MASTERS_CERTIFICATE_TEMPLATES_EDIT.replace(":id", id);
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

export function batchEditPath(companyId, batchId) {
  return ROUTES.BATCHES_EDIT.replace(":companyId", companyId).replace(":batchId", batchId);
}

export function trainerEditPath(id) {
  return ROUTES.TRAINER_EDIT.replace(":id", id);
}

export function courseViewPath(id) {
  return ROUTES.COURSE_VIEW.replace(":id", id);
}

export function lessonViewPath(courseId, moduleId, lessonId) {
  return ROUTES.LESSON_VIEW.replace(":courseId", courseId).replace(":moduleId", moduleId).replace(":lessonId", lessonId);
}

export function myLearningCoursePath(courseId) {
  return ROUTES.MY_LEARNING_COURSE.replace(":courseId", courseId);
}

export function myCertificateViewPath(certificateId) {
  return ROUTES.MY_CERTIFICATE_VIEW.replace(":certificateId", certificateId);
}

export function assignmentSubmissionsPath(assignmentId) {
  return ROUTES.ASSIGNMENT_SUBMISSIONS.replace(":assignmentId", assignmentId);
}

export function assessmentAttemptsPath(assessmentId) {
  return ROUTES.ASSESSMENT_ATTEMPTS.replace(":assessmentId", assessmentId);
}

export function courseAssessmentEditPath(id) {
  return ROUTES.COURSES_ASSESSMENTS_EDIT.replace(":id", id);
}

export function leadViewPath(companyId, leadId) {
  return ROUTES.LEAD_VIEW.replace(":companyId", companyId).replace(":leadId", leadId);
}

export function myLeadViewPath(leadId) {
  return ROUTES.MY_LEAD_VIEW.replace(":leadId", leadId);
}

export function targetEditPath(companyId, targetId) {
  return ROUTES.TARGETS_EDIT.replace(":companyId", companyId).replace(":targetId", targetId);
}

// Where the "Renew Subscription" action should send someone. Only a Company
// Admin can even see the subscription section (it lives inside their own
// Company Profile, CompanyView.jsx) — renew/cancel/payment actions there are
// still Super-Admin-only on the backend (see SubscriptionController), so a
// Trainer/Employee has nothing to navigate to and gets null (banner/expired
// page fall back to plain contact-your-administrator text).
export function subscriptionRenewalPath(roleName) {
  return roleName === "Company Admin" ? ROUTES.COMPANY_PROFILE : null;
}

export function renewalRequestViewPath(id) {
  return ROUTES.MASTERS_RENEWAL_REQUEST_VIEW.replace(":id", id);
}
