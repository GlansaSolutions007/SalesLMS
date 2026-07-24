import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { ROUTES } from "../../router/routePaths.js";

const TABS = [
  { key: "companies", label: "Companies", path: ROUTES.COMPANY_COMPANIES },
  { key: "branches", label: "Branches", path: ROUTES.COMPANY_BRANCHES },
  { key: "departments", label: "Departments", path: ROUTES.COMPANY_DEPARTMENTS },
  { key: "designations", label: "Designations", path: ROUTES.COMPANY_DESIGNATIONS },
];

export default function CompanyTabs() {
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
