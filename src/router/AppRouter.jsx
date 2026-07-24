import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AppLayout from "../components/AppLayout.jsx";
import { flattenMenu } from "../config/menuConfig.js";
import { ROUTES } from "./routePaths.js";

const Login = lazy(() => import("../pages/login.jsx"));
const Dashboard = lazy(() => import("../pages/dashboard.jsx"));
const Placeholder = lazy(() => import("../pages/Placeholder.jsx"));

const CourseList = lazy(() => import("../pages/CourseList.jsx"));
const CourseWizard = lazy(() => import("../pages/courses/wizard/CourseWizard.jsx"));
const CourseCategories = lazy(() => import("../pages/training/CourseCategories.jsx"));
const CourseModules = lazy(() => import("../pages/training/CourseModules.jsx"));
const Lessons = lazy(() => import("../pages/training/Lessons.jsx"));
const LessonResources = lazy(() => import("../pages/training/LessonResources.jsx"));

const EmployeeList = lazy(() => import("../pages/employees/EmployeeList.jsx"));
const EmployeeForm = lazy(() => import("../pages/employees/EmployeeForm.jsx"));
const EmployeeLeave = lazy(() => import("../pages/employees/EmployeeLeave.jsx"));
const EmployeeProfile = lazy(() => import("../pages/employees/EmployeeProfile.jsx"));

const TrainerList = lazy(() => import("../pages/trainers/TrainerList.jsx"));
const TrainerBatchAllocations = lazy(() => import("../pages/trainers/TrainerBatchAllocations.jsx"));
const TrainerProfile = lazy(() => import("../pages/trainers/TrainerProfile.jsx"));

const CompanyList = lazy(() => import("../pages/company/CompanyList.jsx"));
const AddCompanyPage = lazy(() => import("../pages/company/add-company/AddCompanyPage.jsx"));

const SubscriptionPlanList = lazy(() => import("../pages/masters/SubscriptionPlanList.jsx"));
const RoleList = lazy(() => import("../pages/masters/RoleList.jsx"));

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
  employees: EmployeeList,
  trainers: TrainerList,
  "company-companies": CompanyList,
  "masters-subscriptions": SubscriptionPlanList,
  "masters-roles": RoleList,
};

const flatMenu = flattenMenu();

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
                  element={PageComponent ? <PageComponent /> : <Placeholder pageId={item.id} />}
                />
              );
            })}

            {/* Hidden routes reachable via in-page navigation (row actions,
                sub-nav tabs), not shown as their own Sidebar entries. */}
            <Route path={ROUTES.COMPANY_ADD} element={<AddCompanyPage />} />
            <Route path={ROUTES.COURSES_CREATE} element={<CourseWizard />} />
            <Route path={ROUTES.EMPLOYEES_ADD} element={<EmployeeForm />} />
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
