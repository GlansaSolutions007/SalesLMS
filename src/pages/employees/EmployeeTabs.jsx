import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { ROUTES } from "../../router/routePaths.js";

const TABS = [
  { key: "list", label: "Employees", path: ROUTES.EMPLOYEES },
  { key: "leave", label: "Leave Management", path: ROUTES.EMPLOYEES_LEAVE },
];

export default function EmployeeTabs() {
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
