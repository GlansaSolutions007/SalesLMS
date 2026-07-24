import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "./SubNavTabs.jsx";
import { ROUTES } from "../router/routePaths.js";

const TABS = [
  { key: "courses", label: "Course List", path: ROUTES.COURSES },
  { key: "categories", label: "Categories", path: ROUTES.COURSES_CATEGORIES },
  { key: "modules", label: "Modules", path: ROUTES.COURSES_MODULES },
  { key: "lessons", label: "Lessons", path: ROUTES.COURSES_LESSONS },
  { key: "resources", label: "Resources", path: ROUTES.COURSES_RESOURCES },
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
