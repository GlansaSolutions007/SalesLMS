import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { ROUTES } from "../../router/routePaths.js";

const TABS = [
  { key: "subscriptions", label: "Subscription Plans", path: ROUTES.MASTERS_SUBSCRIPTIONS },
  { key: "all-subscriptions", label: "All Subscriptions", path: ROUTES.MASTERS_ALL_SUBSCRIPTIONS },
  { key: "expired-subscriptions", label: "Expired Subscriptions", path: ROUTES.MASTERS_EXPIRED_SUBSCRIPTIONS },
  { key: "renewal-requests", label: "Renewal Requests", path: ROUTES.MASTERS_RENEWAL_REQUESTS },
  { key: "roles", label: "Roles", path: ROUTES.MASTERS_ROLES },
  { key: "permissions", label: "Permissions", path: ROUTES.MASTERS_PERMISSIONS },
  { key: "certificate-templates", label: "Certificate Templates", path: ROUTES.MASTERS_CERTIFICATE_TEMPLATES },
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
