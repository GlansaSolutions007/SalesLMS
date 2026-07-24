import { useLocation, useNavigate } from "react-router-dom";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { ROUTES } from "../../router/routePaths.js";

const TABS = [
  { key: "list", label: "Trainers", path: ROUTES.TRAINERS },
  { key: "batches", label: "Batch Allocation", path: ROUTES.TRAINERS_BATCHES },
];

export default function TrainerTabs() {
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
