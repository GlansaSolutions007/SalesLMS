import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { ROUTES } from "../../router/routePaths.js";

const TABS = [
  { key: "subscriptions", label: "Subscription Plans", path: ROUTES.MASTERS_SUBSCRIPTIONS },
];

export default function MastersTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = TABS.find((tab) => tab.path === pathname)?.key;
  return (
    <SubNavTabs
      tabs={TABS}
      active={active}
      onNavigate={(key) => navigate(TABS.find((t) => t.key === key).path)}
    />
  );
}
