import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "./SubNavTabs.jsx";
import { ROUTES } from "../router/routePaths.js";

const TABS = [
  { key: "courses", label: "Course List", path: ROUTES.COURSES },
  { key: "categories", label: "Categories", path: ROUTES.COURSES_CATEGORIES },
  { key: "modules", label: "Modules", path: ROUTES.COURSES_MODULES },
  { key: "lessons", label: "Lessons", path: ROUTES.COURSES_LESSONS },
  // "Resources" hidden per request — same route still exists, just not
  // linked from this tab bar (kept consistent with the sidebar change).
  { key: "assignments", label: "Assignments", path: ROUTES.COURSES_ASSIGNMENTS },
  // Added alongside (not replacing) Assignments — the sidebar's "Courses"
  // submenu entry was renamed/repointed from Assignments to Assessment, so
  // this keeps both reachable from the same tab bar. Points at the
  // course-scoped CourseAssessments.jsx page, not the standalone
  // all-courses Assessments browse page (ROUTES.ASSESSMENTS).
  { key: "assessment", label: "Assessment", path: ROUTES.COURSES_ASSESSMENTS },
];

export default function TrainingTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = TABS.find((tab) => tab.path === pathname)?.key;

  return (
    <SubNavTabs
      tabs={TABS}
      active={active}
      onNavigate={(key) => navigate(TABS.find((tab) => tab.key === key).path)}
    />
  );
}
