import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { ROUTES } from "../../router/routePaths.js";

const TABS = [
  { key: "sessions", label: "Training Sessions", path: ROUTES.TRAINING_SESSIONS },
  { key: "assign-courses", label: "Assign Courses", path: ROUTES.TRAINING_ASSIGN_COURSES },
];

// Subnav for the "Training" section itself (Training Sessions, Assign
// Courses) — distinct from TrainingTabs.jsx, which despite the name is
// actually the Courses module's tab bar (Course List/Categories/Modules/...).
export default function TrainingSectionTabs() {
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
