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
  // { id: "leads", title: "Leads", icon: "users", path: ROUTES.LEADS, roles: [SA, CA, SM, SE] },
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
      { id: "company-companies", title: "Companies", path: ROUTES.COMPANY_COMPANIES, roles: [SA, CA], permissions: ["companies.view"] },
      { id: "company-branches", title: "Branches", path: ROUTES.COMPANY_BRANCHES, roles: [SA, CA], permissions: ["branches.view"] },
      { id: "company-departments", title: "Departments", path: ROUTES.COMPANY_DEPARTMENTS, roles: [SA, CA], permissions: ["departments.view"] },
      { id: "company-designations", title: "Designations", path: ROUTES.COMPANY_DESIGNATIONS, roles: [SA, CA], permissions: ["designations.view"] },
    ],
  },
  { id: "employees", title: "Employees", icon: "users", path: ROUTES.EMPLOYEES, roles: [SA, CA, SM], permissions: ["employees.view"] },
  { id: "trainers", title: "Trainers", icon: "presentation", path: ROUTES.TRAINERS, roles: [SA, CA], permissions: ["trainers.view"] },
  {
    id: "courses",
    title: "Courses",
    icon: "book",
    path: ROUTES.COURSES,
    roles: [SA, CA, TR, SE],
    permissions: ["courses.view"],
    children: [
      { id: "courses-categories", title: "Categories", path: ROUTES.COURSES_CATEGORIES, roles: [SA, CA, TR], permissions: ["course_categories.view"] },
      { id: "courses-modules", title: "Modules", path: ROUTES.COURSES_MODULES, roles: [SA, CA, TR], permissions: ["courses.view"] },
      { id: "courses-lessons", title: "Lessons", path: ROUTES.COURSES_LESSONS, roles: [SA, CA, TR], permissions: ["lessons.view"] },
      { id: "courses-resources", title: "Resources", path: ROUTES.COURSES_RESOURCES, roles: [SA, CA, TR], permissions: ["lessons.view"] },
    ],
  },
  {
    id: "training",
    title: "Training",
    icon: "cap",
    path: ROUTES.TRAINING,
    roles: [SA, CA, TR],
    permissions: ["training_sessions.view"],
    children: [
      { id: "training-sessions", title: "Training Sessions", path: ROUTES.TRAINING_SESSIONS, roles: [SA, CA, TR], permissions: ["training_sessions.view"] },
    ],
  },
  { id: "batches", title: "Batches", icon: "calendar", path: ROUTES.BATCHES, roles: [SA, CA, TR], permissions: ["batches.view"] },
  { id: "assessments", title: "Assessments", icon: "clipboard", path: ROUTES.ASSESSMENTS, roles: [SA, CA, TR, SE], permissions: ["assessments.view"] },
  { id: "assignments", title: "Assignments", icon: "edit", path: ROUTES.ASSIGNMENTS, roles: [SA, CA, TR, SE], permissions: ["assignments.view"] },
  { id: "certificates", title: "Certificates", icon: "trophy", path: ROUTES.CERTIFICATES, roles: [SA, CA, SE], permissions: ["certificates.view"] },
  // { id: "sales", title: "Sales", icon: "coin", path: ROUTES.SALES, roles: [SA, CA, SM] },
  { id: "targets", title: "Targets", icon: "flag", path: ROUTES.TARGETS, roles: [SA, CA, SM, SE] },
  { id: "rewards", title: "Rewards", icon: "gift", path: ROUTES.REWARDS, roles: [SA, CA, SM, SE] },
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
  { id: "masters", title: "Masters", icon: "gridView", path: ROUTES.MASTERS, roles: [SA], permissions: ["master_data.view"] },
  { id: "settings", title: "Settings", icon: "settings", path: ROUTES.SETTINGS, roles: ALL, permissions: ["settings.view"] },
  { id: "audit", title: "Audit Logs", icon: "clock", path: ROUTES.AUDIT, roles: [SA], permissions: ["audit_logs.view"] },
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
  return menuConfig.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
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
