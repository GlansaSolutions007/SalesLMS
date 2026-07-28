import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AppLayout from "../components/AppLayout.jsx";
import { flattenMenu, isMenuItemVisible } from "../config/menuConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "./routePaths.js";

const Login = lazy(() => import("../pages/login.jsx"));
const Dashboard = lazy(() => import("../pages/dashboard.jsx"));
const Placeholder = lazy(() => import("../pages/Placeholder.jsx"));
const MyProfile = lazy(() => import("../pages/MyProfile.jsx"));

const CourseList = lazy(() => import("../pages/CourseList.jsx"));
const CourseWizard = lazy(() => import("../pages/courses/wizard/CourseWizard.jsx"));
const CourseCategories = lazy(() => import("../pages/training/CourseCategories.jsx"));
const CourseModules = lazy(() => import("../pages/training/CourseModules.jsx"));
const Lessons = lazy(() => import("../pages/training/Lessons.jsx"));
const LessonResources = lazy(() => import("../pages/training/LessonResources.jsx"));
const AssignCourses = lazy(() => import("../pages/training/AssignCourses.jsx"));
const AssignCourseAdd = lazy(() => import("../pages/training/AssignCourseAdd.jsx"));

const EmployeeList = lazy(() => import("../pages/employees/EmployeeList.jsx"));
const EmployeeForm = lazy(() => import("../pages/employees/EmployeeForm.jsx"));
const EmployeeLeave = lazy(() => import("../pages/employees/EmployeeLeave.jsx"));
const EmployeeProfile = lazy(() => import("../pages/employees/EmployeeProfile.jsx"));

const TrainerList = lazy(() => import("../pages/trainers/TrainerList.jsx"));
const TrainerBatchAllocations = lazy(() => import("../pages/trainers/TrainerBatchAllocations.jsx"));
const TrainerProfile = lazy(() => import("../pages/trainers/TrainerProfile.jsx"));

const CompanyList = lazy(() => import("../pages/company/CompanyList.jsx"));
const CompanyBranches = lazy(() => import("../pages/company/CompanyBranches.jsx"));
const CompanyBranchView = lazy(() => import("../pages/company/CompanyBranchView.jsx"));
const CompanyDepartments = lazy(() => import("../pages/company/CompanyDepartments.jsx"));
const CompanyDepartmentView = lazy(() => import("../pages/company/CompanyDepartmentView.jsx"));
const CompanyDesignations = lazy(() => import("../pages/company/CompanyDesignations.jsx"));
const CompanyDesignationView = lazy(() => import("../pages/company/CompanyDesignationView.jsx"));
const AddCompanyPage = lazy(() => import("../pages/company/add-company/AddCompanyPage.jsx"));
const CompanyView = lazy(() => import("../pages/company/CompanyView.jsx"));
const EditCompanyPage = lazy(() => import("../pages/company/edit-company/EditCompanyPage.jsx"));

const SubscriptionPlanList = lazy(() => import("../pages/masters/SubscriptionPlanList.jsx"));
const RoleList = lazy(() => import("../pages/masters/RoleList.jsx"));

// "Company Management" is a pure container with no page of its own — land
// on its first child section instead of a blank Placeholder.
function CompanyRedirect() {
  return <Navigate to={ROUTES.COMPANY_COMPANIES} replace />;
}

// Menu entries with a real, already-built page. Everything else in
// menuConfig still gets a route (at its correct URL) rendering the shared
// Placeholder, so every menu item is navigable even before its module ships.
const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  courses: CourseList,
  "courses-categories": CourseCategories,
  "courses-modules": CourseModules,
  "courses-lessons": Lessons,
  "courses-resources": LessonResources,
  "training-assign-courses": AssignCourses,
  employees: EmployeeList,
  trainers: TrainerList,
  company: CompanyRedirect,
  "company-companies": CompanyList,
  "company-branches": CompanyBranches,
  "company-departments": CompanyDepartments,
  "company-designations": CompanyDesignations,
  "masters-subscriptions": SubscriptionPlanList,
  "masters-roles": RoleList,
};

const flatMenu = flattenMenu();

// Sidebar visibility and route access must agree, so this reuses the exact
// same isMenuItemVisible() check the Sidebar already uses — a role/permission
// combination that hides a menu item also blocks navigating straight to its
// URL, instead of only hiding the link.
function GuardedMenuRoute({ item, children }) {
  const { roleName, permissions } = useAuth();
  if (!isMenuItemVisible(item, { roleName, permissions })) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<div className="route-loading">Loading…</div>}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />

            {flatMenu.map((item) => {
              const PageComponent = PAGE_COMPONENTS[item.id];
              return (
                <Route
                  key={item.path}
                  path={item.path}
                  element={
                    <GuardedMenuRoute item={item}>{PageComponent ? <PageComponent /> : <Placeholder pageId={item.id} />}</GuardedMenuRoute>
                  }
                />
              );
            })}

            {/* Hidden routes reachable via in-page navigation (row actions,
                sub-nav tabs), not shown as their own Sidebar entries. */}
            <Route path={ROUTES.MY_PROFILE} element={<MyProfile />} />
            <Route path={ROUTES.COMPANY_BRANCH_VIEW} element={<CompanyBranchView />} />
            <Route path={ROUTES.COMPANY_DEPARTMENT_VIEW} element={<CompanyDepartmentView />} />
            <Route path={ROUTES.COMPANY_DESIGNATION_VIEW} element={<CompanyDesignationView />} />
            <Route path={ROUTES.COMPANY_ADD} element={<AddCompanyPage />} />
            <Route path={ROUTES.COMPANY_VIEW} element={<CompanyView />} />
            <Route path={ROUTES.COMPANY_EDIT} element={<EditCompanyPage />} />
            <Route path={ROUTES.COURSES_CREATE} element={<CourseWizard />} />
            <Route path={ROUTES.TRAINING_ASSIGN_COURSES_ADD} element={<AssignCourseAdd />} />
            <Route path={ROUTES.EMPLOYEES_ADD} element={<EmployeeForm />} />
            <Route path={ROUTES.EMPLOYEES_EDIT} element={<EmployeeForm />} />
            <Route path={ROUTES.EMPLOYEES_LEAVE} element={<EmployeeLeave />} />
            <Route path={ROUTES.EMPLOYEE_PROFILE} element={<EmployeeProfile />} />
            <Route path={ROUTES.TRAINERS_BATCHES} element={<TrainerBatchAllocations />} />
            <Route path={ROUTES.TRAINER_PROFILE} element={<TrainerProfile />} />

            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
