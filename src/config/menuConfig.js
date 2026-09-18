import { ROUTES } from "../router/routePaths.js";

export const ROLES = ["Super Admin", "Company Admin", "Trainer", "Sales Manager", "Sales Employee"];

const [SA, CA, TR, SM, SE] = ROLES;
const ALL = ROLES;

// Centralized menu + route source of truth. The Sidebar renders from this,
// and the router generates routes from it — a menu entry and its URL can
// never drift apart.
//
// Visibility per item is decided by `isMenuItemVisible()` below:
//   - if `permissions` is set, the user needs at least one of those exact
//     permission strings (matches the real login API's `permissions` array)
//   - otherwise falls back to `roles` (mock role-name check) — used for
//     sections like Leads/Sales/Targets that aren't in the LMS permission
//     vocabulary the backend gave us yet
export const menuConfig = [
  { id: "dashboard", title: "Dashboard", icon: "grid", path: ROUTES.DASHBOARD, roles: ALL },
  // "Employee" is a real backend role (see RolesSeeder) distinct from the
  // frontend's mock "Sales Employee" — it's the LMS learner role and isn't
  // part of the ROLES/ALL constant above, so it's listed explicitly here.
  { id: "my-learning", title: "My Learning", icon: "cap", path: ROUTES.MY_LEARNING, roles: ["Employee"] },
  { id: "my-certificates", title: "My Certificates", icon: "trophy", path: ROUTES.MY_CERTIFICATES, roles: ["Employee"] },
  // "Employee" is the real backend role for the learner/sales-rep login (see
  // note above), so Leads/Target/Incentives use it directly rather than the
  // frontend-only SM/SE mock constants. Grouped under one accordion section
  // — ids/paths/roles unchanged from when these were top-level entries, so
  // routing (AppRouter's flatMenu.map) and PAGE_COMPONENTS lookups still
  // resolve the same as before.
  {
    id: "sales-performance",
    title: "Sales Performance",
    icon: "coin",
    path: ROUTES.SALES_PERFORMANCE,
    roles: [SA, CA, "Employee"],
    children: [
      // "Leads" is the company-wide lead pool + verification queue (Company
      // Admin only); an Employee gets their own separate "My Leads" entry
      // below instead, per the Lead Management spec's menu layout.
      { id: "leads", title: "Leads", path: ROUTES.LEADS, roles: [SA, CA] },
      // Assign Employee: after manual creation or Excel/CSV import (which no
      // longer takes an Assigned Employee column), Company Admin/Super
      // Admin assign leads to an individual employee here — single lead or
      // bulk. Never a Team.
      { id: "assign-leads", title: "Assign Employee", path: ROUTES.ASSIGN_LEADS, roles: [SA, CA] },
      { id: "my-leads", title: "My Leads", path: ROUTES.MY_LEADS, roles: ["Employee"] },
      { id: "followups", title: "Follow-ups", path: ROUTES.FOLLOWUPS, roles: [SA, CA, "Employee"] },
      { id: "targets", title: "Target", path: ROUTES.TARGETS, roles: [SA, CA, "Employee"] },
      { id: "employee-target-performance", title: "Employee Target Performance", path: ROUTES.EMPLOYEE_TARGET_PERFORMANCE, roles: [SA, CA] },
      // { id: "rewards", title: "Incentives", path: ROUTES.REWARDS, roles: [SA, CA, "Employee"] },
    ],
  },
  // { id: "pipeline", title: "Sales Pipeline", icon: "pipeline", path: ROUTES.PIPELINE, roles: [SA, CA, SM] },
  // { id: "activities", title: "Activities", icon: "calendar", path: ROUTES.ACTIVITIES, roles: [SA, CA, TR] },
  {
    id: "company",
    title: "Company Management",
    icon: "building",
    path: ROUTES.COMPANY,
    roles: [SA, CA],
    permissions: ["companies.view"],
    children: [
      // Super Admin only — a Company Admin manages their own single company
      // via the profile/settings pages, not this cross-company list.
      { id: "company-companies", title: "Companies", path: ROUTES.COMPANY_COMPANIES, roles: [SA] },
      // Company Admin only — their own company's profile (view + edit),
      // resolved from the logged-in user rather than an :id in the URL.
      { id: "company-profile", title: "Company Profile", path: ROUTES.COMPANY_PROFILE, roles: [CA] },
      { id: "company-branches", title: "Branches", path: ROUTES.COMPANY_BRANCHES, roles: [SA, CA], permissions: ["branches.view"] },
      // { id: "company-departments", title: "Departments", path: ROUTES.COMPANY_DEPARTMENTS, roles: [SA, CA], permissions: ["departments.view"] },
      { id: "company-designations", title: "Designations", path: ROUTES.COMPANY_DESIGNATIONS, roles: [SA, CA], permissions: ["designations.view"] },
      // Super Admin only — creates/manages the Company Admin login for any company.
      { id: "company-admins", title: "Admins", path: ROUTES.COMPANY_ADMINS, roles: [SA] },
      // Compliance documents — Super Admin (any company) or Company Admin (their own).
      { id: "company-documents", title: "Documents", path: ROUTES.COMPANY_DOCUMENTS, roles: [SA, CA] },
    ],
  },
  { id: "employees", title: "Employees", icon: "users", path: ROUTES.EMPLOYEES, roles: [SA, CA, SM], permissions: ["employees.view"] },
  {
    // Company Admin no longer gets this section — courses are managed by
    // Super Admin / Trainers; a Company Admin only assigns/tracks them via
    // Training.
    id: "courses",
    title: "Courses",
    icon: "book",
    path: ROUTES.COURSES,
    roles: [SA, TR, SE],
    children: [
      // The parent "Courses" link itself already resolves to this same page
      // (see PAGE_COMPONENTS in AppRouter.jsx) — this child just gives it a
      // clickable entry inside the submenu too, since clicking the parent
      // only expands/collapses the accordion (see Sidebar.jsx) rather than
      // navigating anywhere on its own.
      { id: "courses-list", title: "Course List", path: ROUTES.COURSES, roles: [SA, TR, SE] },
      { id: "courses-categories", title: "Categories", path: ROUTES.COURSES_CATEGORIES, roles: [SA, TR] },
      { id: "courses-modules", title: "Modules", path: ROUTES.COURSES_MODULES, roles: [SA, TR] },
      { id: "courses-lessons", title: "Lessons", path: ROUTES.COURSES_LESSONS, roles: [SA, TR] },
      // "Resources" hidden from the sidebar per request — the route/page
      // (LessonResources.jsx) is untouched, just not linked here anymore.
      // "Assignments" replaced with "Assessment" per request — points at a
      // dedicated course-scoped Assessment page (CourseAssessments.jsx,
      // ROUTES.COURSES_ASSESSMENTS) separate from the standalone, all-courses
      // Assessments browse page (ROUTES.ASSESSMENTS / AssessmentsList.jsx,
      // still linked from the top-level "assessments" entry below). id kept
      // distinct from that entry to avoid two menu items sharing one id —
      // findMenuItemById()/PAGE_COMPONENTS both key off it. Assignments.jsx
      // is still reachable via the Training Tabs on this same page, just no
      // longer has its own sidebar entry.
      { id: "courses-assessments", title: "Assessment", path: ROUTES.COURSES_ASSESSMENTS, roles: [SA, TR] },
    ],
  },
  {
    id: "training",
    title: "Training Management",
    icon: "cap",
    path: ROUTES.TRAINING,
    roles: [SA, CA, TR],
    // Widened to include "trainers.view" so a role that can manage trainers
    // but not training sessions still sees this section (the parent gate
    // runs before children are considered — see isMenuItemVisible below —
    // so without this a "trainers.view"-only role would lose the Trainers
    // link entirely now that it's nested here instead of top-level).
    permissions: ["training_sessions.view", "trainers.view"],
    children: [
      // Trainers kept its own separate top-level URL (ROUTES.TRAINERS,
      // "/trainers") rather than moving under "/training/..." — findMenuRoot()
      // and Sidebar's isSectionActive() both already fall back to checking
      // children's own paths for exactly this case (see Sales Performance).
      { id: "trainers", title: "Trainers", path: ROUTES.TRAINERS, roles: [SA, CA], permissions: ["trainers.view"] },
      // Moved here from Masters — a Batch is a per-company group of
      // employees taking training, so it belongs alongside the other
      // training-delivery screens rather than the system-config catalog
      // (Subscription Plans/Roles/Permissions) Masters is otherwise for.
      // Role/permission widened to match its Training siblings: Company
      // Admin and Trainer can already reach the batch API for their own
      // company (BatchController::authorizeAccess), they just had no menu
      // entry to get there before.
      { id: "masters-batches", title: "Batches", path: ROUTES.BATCHES, roles: [SA, CA, TR], permissions: ["training_sessions.view"] },
      { id: "training-sessions", title: "Training Sessions", path: ROUTES.TRAINING_SESSIONS, roles: [SA, CA, TR], permissions: ["training_sessions.view"] },
      { id: "training-assign-courses", title: "Assign Courses", path: ROUTES.TRAINING_ASSIGN_COURSES, roles: [SA, CA, TR], permissions: ["training_sessions.view"] },
      { id: "training-employee-progress", title: "Employee Progress", path: ROUTES.TRAINING_EMPLOYEE_PROGRESS, roles: [SA, CA, TR], permissions: ["training_sessions.view"] },
    ],
  },
  // { id: "assessments", title: "Assessments", icon: "clipboard", path: ROUTES.ASSESSMENTS, roles: [SA, CA, TR, SE], permissions: ["assessments.view"] },
  // { id: "assignments", title: "Assignments", icon: "edit", path: ROUTES.ASSIGNMENTS, roles: [SA, CA, TR, SE], permissions: ["assignments.view"] },
  { id: "certificates", title: "Certificates", icon: "trophy", path: ROUTES.CERTIFICATES, roles: [SA, CA, SE], permissions: ["certificates.view"] },
  // { id: "sales", title: "Sales", icon: "coin", path: ROUTES.SALES, roles: [SA, CA, SM] },
  {
    id: "reports",
    title: "Reports",
    icon: "barChart",
    path: ROUTES.REPORTS,
    roles: [SA, CA, TR, SM],
    permissions: ["reports.training", "reports.assessment", "reports.certification", "reports.attendance", "reports.performance", "reports.trainer"],
  },
  { id: "analytics", title: "Analytics", icon: "pieChart", path: ROUTES.ANALYTICS, roles: [SA, CA, SM] },
  { id: "notifications", title: "Notifications", icon: "bell", path: ROUTES.NOTIFICATIONS, roles: ALL, permissions: ["notifications.view"] },
  {
    id: "masters",
    title: "Masters",
    icon: "gridView",
    path: ROUTES.MASTERS,
    roles: [SA],
    permissions: ["master_data.view"],
    children: [
      { id: "masters-subscriptions", title: "Subscription Plans", path: ROUTES.MASTERS_SUBSCRIPTIONS, roles: [SA], permissions: ["master_data.view"] },
      { id: "masters-all-subscriptions", title: "All Subscriptions", path: ROUTES.MASTERS_ALL_SUBSCRIPTIONS, roles: [SA], permissions: ["master_data.view"] },
      { id: "masters-expired-subscriptions", title: "Expired Subscriptions", path: ROUTES.MASTERS_EXPIRED_SUBSCRIPTIONS, roles: [SA], permissions: ["master_data.view"] },
      { id: "masters-renewal-requests", title: "Renewal Requests", path: ROUTES.MASTERS_RENEWAL_REQUESTS, roles: [SA], permissions: ["master_data.view"] },
      { id: "masters-roles", title: "Roles", path: ROUTES.MASTERS_ROLES, roles: [SA], permissions: ["master_data.view"] },
      { id: "masters-permissions", title: "Permissions", path: ROUTES.MASTERS_PERMISSIONS, roles: [SA], permissions: ["master_data.view"] },
      // Dedicated seeded permissions (certificate_templates.view/.create/.edit
      // — see PermissionsSeeder) rather than the blanket master_data.view
      // other Masters entries use, since this feature seeded its own ahead
      // of time. Super Admin holds every permission regardless (see
      // RolePermissionsSeeder), so this can't lock the role out.
      { id: "masters-certificate-templates", title: "Certificate Templates", path: ROUTES.MASTERS_CERTIFICATE_TEMPLATES, roles: [SA], permissions: ["certificate_templates.view"] },
    ],
  },
  { id: "settings", title: "Settings", icon: "settings", path: ROUTES.SETTINGS, roles: ALL, permissions: ["settings.view"] },
  // { id: "audit", title: "Audit Logs", icon: "clock", path: ROUTES.AUDIT, roles: [SA], permissions: ["audit_logs.view"] },
];

export function flattenMenu(items = menuConfig) {
  return items.flatMap((item) => [item, ...(item.children ? flattenMenu(item.children) : [])]);
}

const flatMenu = flattenMenu();

export function findMenuItemById(id) {
  return flatMenu.find((item) => item.id === id);
}

// Longest-prefix match: the top-level menu item whose path is an ancestor
// of `pathname` (so hidden sub-routes like /employees/profile still resolve
// to the "Employees" section for breadcrumb/title purposes).
export function findMenuRoot(pathname) {
  const topMatch = menuConfig.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (topMatch) return topMatch;
  // Fallback for groups whose children live at their own separate top-level
  // URLs rather than nested under the parent's path prefix — e.g. "Sales
  // Performance"'s Leads/Target/Incentives kept their original /leads,
  // /targets, /rewards routes when they were folded into that group.
  return menuConfig.find((item) =>
    (item.children ?? []).some((child) => pathname === child.path || pathname.startsWith(`${child.path}/`))
  );
}

// Exact match first (covers nested children like /courses/categories),
// falling back to the root section title.
export function getPageTitle(pathname) {
  const exact = flatMenu.find((item) => item.path === pathname);
  if (exact) return exact.title;
  return findMenuRoot(pathname)?.title ?? "Sales LMS";
}

// item.id === "dashboard" always passes: every authenticated user lands
// somewhere, and it's never gated by a specific permission.
export function isMenuItemVisible(item, { roleName, permissions = [] }) {
  if (item.id === "dashboard") return true;
  if (item.permissions?.length) {
    return item.permissions.some((p) => permissions.includes(p));
  }
  return item.roles?.includes(roleName) ?? false;
}
