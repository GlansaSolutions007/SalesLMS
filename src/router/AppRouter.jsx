import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AppLayout from "../components/AppLayout.jsx";
import { menuConfig, flattenMenu, isMenuItemVisible } from "../config/menuConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "./routePaths.js";

const Login = lazy(() => import("../pages/login.jsx"));
const Dashboard = lazy(() => import("../pages/dashboard.jsx"));
const Placeholder = lazy(() => import("../pages/Placeholder.jsx"));
const MyProfile = lazy(() => import("../pages/MyProfile.jsx"));
const SubscriptionExpired = lazy(() => import("../pages/SubscriptionExpired.jsx"));
const MyLearning = lazy(() => import("../pages/learning/MyLearning.jsx"));
const CoursePlayer = lazy(() => import("../pages/learning/CoursePlayer.jsx"));
const MyCertificates = lazy(() => import("../pages/learning/MyCertificates.jsx"));
const CertificateView = lazy(() => import("../pages/learning/CertificateView.jsx"));

const CourseList = lazy(() => import("../pages/CourseList.jsx"));
const CourseWizard = lazy(() => import("../pages/courses/wizard/CourseWizard.jsx"));
const CourseDetails = lazy(() => import("../pages/courses/CourseDetails.jsx"));
const AssessmentsList = lazy(() => import("../pages/assessments/AssessmentsList.jsx"));
const AssessmentAttempts = lazy(() => import("../pages/assessments/AssessmentAttempts.jsx"));
const Reports = lazy(() => import("../pages/reports/Reports.jsx"));
const Settings = lazy(() => import("../pages/settings/Settings.jsx"));
const CourseCategories = lazy(() => import("../pages/training/CourseCategories.jsx"));
const CourseModules = lazy(() => import("../pages/training/CourseModules.jsx"));
const Lessons = lazy(() => import("../pages/training/Lessons.jsx"));
const LessonResources = lazy(() => import("../pages/training/LessonResources.jsx"));
const Assignments = lazy(() => import("../pages/training/Assignments.jsx"));
const CourseAssessments = lazy(() => import("../pages/training/CourseAssessments.jsx"));
const CourseAssessmentForm = lazy(() => import("../pages/training/CourseAssessmentForm.jsx"));
const AssignmentSubmissions = lazy(() => import("../pages/training/AssignmentSubmissions.jsx"));
const LessonDetails = lazy(() => import("../pages/training/LessonDetails.jsx"));
const AssignCourses = lazy(() => import("../pages/training/AssignCourses.jsx"));
const AssignCourseAdd = lazy(() => import("../pages/training/AssignCourseAdd.jsx"));
const TrainingSessions = lazy(() => import("../pages/training/TrainingSessions.jsx"));
const EmployeeProgress = lazy(() => import("../pages/training/EmployeeProgress.jsx"));

const EmployeeList = lazy(() => import("../pages/employees/EmployeeList.jsx"));
const EmployeeForm = lazy(() => import("../pages/employees/EmployeeForm.jsx"));
const EmployeeLeave = lazy(() => import("../pages/employees/EmployeeLeave.jsx"));
const EmployeeProfile = lazy(() => import("../pages/employees/EmployeeProfile.jsx"));

const TrainerList = lazy(() => import("../pages/trainers/TrainerList.jsx"));
const TrainerBatchAllocations = lazy(() => import("../pages/trainers/TrainerBatchAllocations.jsx"));
const TrainerProfile = lazy(() => import("../pages/trainers/TrainerProfile.jsx"));
const TrainerForm = lazy(() => import("../pages/trainers/TrainerForm.jsx"));

const CompanyList = lazy(() => import("../pages/company/CompanyList.jsx"));
const CompanyBranches = lazy(() => import("../pages/company/CompanyBranches.jsx"));
const CompanyBranchView = lazy(() => import("../pages/company/CompanyBranchView.jsx"));
const CompanyDepartments = lazy(() => import("../pages/company/CompanyDepartments.jsx"));
const CompanyDepartmentView = lazy(() => import("../pages/company/CompanyDepartmentView.jsx"));
const CompanyDesignations = lazy(() => import("../pages/company/CompanyDesignations.jsx"));
const CompanyDesignationView = lazy(() => import("../pages/company/CompanyDesignationView.jsx"));
const CompanyAdmins = lazy(() => import("../pages/company/CompanyAdmins.jsx"));
const CompanyDocuments = lazy(() => import("../pages/company/CompanyDocuments.jsx"));
const AddCompanyPage = lazy(() => import("../pages/company/add-company/AddCompanyPage.jsx"));
const CompanyView = lazy(() => import("../pages/company/CompanyView.jsx"));
const EditCompanyPage = lazy(() => import("../pages/company/edit-company/EditCompanyPage.jsx"));

const LeadsPage = lazy(() => import("../pages/leads/LeadsPage.jsx"));
const LeadForm = lazy(() => import("../pages/leads/LeadForm.jsx"));
const LeadProfile = lazy(() => import("../pages/leads/LeadProfile.jsx"));
const MyAssignedLeads = lazy(() => import("../pages/leads/MyAssignedLeads.jsx"));
const MyLeadTracking = lazy(() => import("../pages/leads/MyLeadTracking.jsx"));
const AssignLeadsPage = lazy(() => import("../pages/leads/AssignLeadsPage.jsx"));
const FollowupsPage = lazy(() => import("../pages/leads/FollowupsPage.jsx"));
const TargetsPage = lazy(() => import("../pages/targets/TargetsPage.jsx"));
const TargetForm = lazy(() => import("../pages/targets/TargetForm.jsx"));
const IncentivesPage = lazy(() => import("../pages/incentives/IncentivesPage.jsx"));
const EmployeeTargetPerformance = lazy(() => import("../pages/salesPerformance/EmployeeTargetPerformance.jsx"));

const SubscriptionPlanList = lazy(() => import("../pages/masters/SubscriptionPlanList.jsx"));
const AllSubscriptions = lazy(() => import("../pages/masters/AllSubscriptions.jsx"));
const ExpiredSubscriptions = lazy(() => import("../pages/masters/ExpiredSubscriptions.jsx"));
const RenewalRequests = lazy(() => import("../pages/masters/RenewalRequests.jsx"));
const RenewalRequestView = lazy(() => import("../pages/masters/RenewalRequestView.jsx"));
const RoleList = lazy(() => import("../pages/masters/RoleList.jsx"));
const PermissionList = lazy(() => import("../pages/masters/PermissionList.jsx"));
const RolePermissions = lazy(() => import("../pages/masters/RolePermissions.jsx"));
const BatchList = lazy(() => import("../pages/masters/BatchList.jsx"));
const BatchForm = lazy(() => import("../pages/masters/BatchForm.jsx"));
const CertificateTemplateList = lazy(() => import("../pages/masters/CertificateTemplateList.jsx"));
const CertificateTemplateForm = lazy(() => import("../pages/masters/CertificateTemplateForm.jsx"));

// "Company Management" is a pure container with no page of its own — land
// on the first child section the current role can actually see (a Company
// Admin can't see "Companies", so hard-coding that path here would bounce
// them straight to the Dashboard via GuardedMenuRoute).
function CompanyRedirect() {
  const { roleName, permissions } = useAuth();
  const companyItem = menuConfig.find((item) => item.id === "company");
  const firstVisibleChild = companyItem?.children?.find((child) =>
    isMenuItemVisible(child, { roleName, permissions })
  );
  return <Navigate to={firstVisibleChild?.path ?? ROUTES.DASHBOARD} replace />;
}

// Menu entries with a real, already-built page. Everything else in
// menuConfig still gets a route (at its correct URL) rendering the shared
// Placeholder, so every menu item is navigable even before its module ships.
const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  courses: CourseList,
  "courses-list": CourseList,
  "courses-categories": CourseCategories,
  "courses-modules": CourseModules,
  "courses-lessons": Lessons,
  "courses-resources": LessonResources,
  "courses-assessments": CourseAssessments,
  "training-sessions": TrainingSessions,
  "training-assign-courses": AssignCourses,
  "training-employee-progress": EmployeeProgress,
  assessments: AssessmentsList,
  reports: Reports,
  settings: Settings,
  "my-learning": MyLearning,
  "my-certificates": MyCertificates,
  employees: EmployeeList,
  trainers: TrainerList,
  company: CompanyRedirect,
  "company-companies": CompanyList,
  "company-profile": CompanyView,
  "company-branches": CompanyBranches,
  "company-departments": CompanyDepartments,
  "company-designations": CompanyDesignations,
  "company-admins": CompanyAdmins,
  "company-documents": CompanyDocuments,
  "masters-subscriptions": SubscriptionPlanList,
  "masters-all-subscriptions": AllSubscriptions,
  "masters-expired-subscriptions": ExpiredSubscriptions,
  "masters-renewal-requests": RenewalRequests,
  "masters-roles": RoleList,
  "masters-permissions": PermissionList,
  "masters-batches": BatchList,
  "masters-certificate-templates": CertificateTemplateList,
  leads: LeadsPage,
  "assign-leads": AssignLeadsPage,
  "my-leads": MyAssignedLeads,
  followups: FollowupsPage,
  targets: TargetsPage,
  rewards: IncentivesPage,
  "employee-target-performance": EmployeeTargetPerformance,
};

const flatMenu = flattenMenu();

// Menu items gated once a company's subscription has expired (Company
// Admin/Trainer/Employee only — Super Admin is exempt, see AuthContext's
// `subscriptionExpired`). Mirrors ApiAuthenticate::RESTRICTED_PATTERNS on
// the backend, which is the actual enforcement point — this only saves a
// round trip by redirecting before the page even tries to load data.
// "dashboard" is deliberately absent: it stays reachable and shows a
// subscription warning in place of live stats instead of being blocked.
const SUBSCRIPTION_RESTRICTED_MENU_IDS = new Set([
  "courses",
  "courses-list",
  "courses-categories",
  "courses-modules",
  "courses-lessons",
  "courses-resources",
  "courses-assessments",
  "assessments",
  "trainers",
  "masters-batches",
  "training-sessions",
  "training-assign-courses",
  "training-employee-progress",
  "my-learning",
  "my-certificates",
  "certificates",
  "reports",
  "employees",
]);

// Sidebar visibility and route access must agree, so this reuses the exact
// same isMenuItemVisible() check the Sidebar already uses — a role/permission
// combination that hides a menu item also blocks navigating straight to its
// URL, instead of only hiding the link.
function GuardedMenuRoute({ item, children }) {
  const { roleName, permissions, subscriptionExpired } = useAuth();
  if (!isMenuItemVisible(item, { roleName, permissions })) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  if (subscriptionExpired && SUBSCRIPTION_RESTRICTED_MENU_IDS.has(item.id)) {
    return <Navigate to={ROUTES.SUBSCRIPTION_EXPIRED} replace />;
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
                  key={item.id}
                  path={item.path}
                  element={
                    <GuardedMenuRoute item={item}>{PageComponent ? <PageComponent /> : <Placeholder pageId={item.id} />}</GuardedMenuRoute>
                  }
                />
              );
            })}

            {/* Hidden routes reachable via in-page navigation (row actions,
                sub-nav tabs), not shown as their own Sidebar entries. */}
            {/* Assignments.jsx lost its sidebar entry when Courses >
                "Assignments" was renamed/repointed to Assessment — it's
                still reachable via the Training Tabs on this page, so the
                route has to stay registered even without a menu entry. */}
            <Route path={ROUTES.COURSES_ASSIGNMENTS} element={<Assignments />} />
            <Route path={ROUTES.COURSES_ASSESSMENTS_ADD} element={<CourseAssessmentForm />} />
            <Route path={ROUTES.COURSES_ASSESSMENTS_EDIT} element={<CourseAssessmentForm />} />
            <Route path={ROUTES.MY_PROFILE} element={<MyProfile />} />
            <Route path={ROUTES.SUBSCRIPTION_EXPIRED} element={<SubscriptionExpired />} />
            <Route path={ROUTES.MY_LEARNING_COURSE} element={<CoursePlayer />} />
            <Route path={ROUTES.MY_CERTIFICATE_VIEW} element={<CertificateView />} />
            <Route path={ROUTES.COMPANY_BRANCH_VIEW} element={<CompanyBranchView />} />
            <Route path={ROUTES.COMPANY_DEPARTMENT_VIEW} element={<CompanyDepartmentView />} />
            <Route path={ROUTES.COMPANY_DESIGNATION_VIEW} element={<CompanyDesignationView />} />
            <Route path={ROUTES.MASTERS_ROLE_PERMISSIONS} element={<RolePermissions />} />
            <Route path={ROUTES.MASTERS_RENEWAL_REQUEST_VIEW} element={<RenewalRequestView />} />
            <Route path={ROUTES.COMPANY_ADD} element={<AddCompanyPage />} />
            <Route path={ROUTES.COMPANY_VIEW} element={<CompanyView />} />
            <Route path={ROUTES.COMPANY_EDIT} element={<EditCompanyPage />} />
            <Route path={ROUTES.COMPANY_PROFILE_EDIT} element={<EditCompanyPage />} />
            <Route path={ROUTES.COURSES_CREATE} element={<CourseWizard />} />
            <Route path={ROUTES.COURSE_VIEW} element={<CourseDetails />} />
            <Route path={ROUTES.LESSON_VIEW} element={<LessonDetails />} />
            <Route path={ROUTES.ASSESSMENT_ATTEMPTS} element={<AssessmentAttempts />} />
            <Route path={ROUTES.ASSIGNMENT_SUBMISSIONS} element={<AssignmentSubmissions />} />
            <Route path={ROUTES.TRAINING_ASSIGN_COURSES_ADD} element={<AssignCourseAdd />} />
            <Route path={ROUTES.EMPLOYEES_ADD} element={<EmployeeForm />} />
            <Route path={ROUTES.EMPLOYEES_EDIT} element={<EmployeeForm />} />
            <Route path={ROUTES.EMPLOYEES_LEAVE} element={<EmployeeLeave />} />
            <Route path={ROUTES.EMPLOYEE_PROFILE} element={<EmployeeProfile />} />
            <Route path={ROUTES.TRAINERS_BATCHES} element={<TrainerBatchAllocations />} />
            <Route path={ROUTES.TRAINER_ADD} element={<TrainerForm />} />
            <Route path={ROUTES.TRAINER_EDIT} element={<TrainerForm />} />
            <Route path={ROUTES.TRAINER_PROFILE} element={<TrainerProfile />} />
            <Route path={ROUTES.BATCHES_ADD} element={<BatchForm />} />
            <Route path={ROUTES.BATCHES_EDIT} element={<BatchForm />} />
            <Route path={ROUTES.MASTERS_CERTIFICATE_TEMPLATES_ADD} element={<CertificateTemplateForm />} />
            <Route path={ROUTES.MASTERS_CERTIFICATE_TEMPLATES_EDIT} element={<CertificateTemplateForm />} />
            <Route path={ROUTES.LEADS_ADD} element={<LeadForm />} />
            <Route path={ROUTES.LEAD_VIEW} element={<LeadProfile />} />
            <Route path={ROUTES.MY_LEAD_VIEW} element={<MyLeadTracking />} />
            <Route path={ROUTES.TARGETS_ADD} element={<TargetForm />} />
            <Route path={ROUTES.TARGETS_EDIT} element={<TargetForm />} />

            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
