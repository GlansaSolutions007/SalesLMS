import { useAuth } from "../../context/AuthContext.jsx";
import SuperAdminDashboard from "./SuperAdminDashboard.jsx";
import CompanyAdminDashboard from "./CompanyAdminDashboard.jsx";
import TrainerDashboard from "./TrainerDashboard.jsx";
import SalesManagerDashboard from "./SalesManagerDashboard.jsx";
import SalesEmployeeDashboard from "./SalesEmployeeDashboard.jsx";

export default function DashboardRouter() {
  const { roleName } = useAuth();

  if (roleName === "Super Admin") return <SuperAdminDashboard />;
  if (roleName === "Company Admin") return <CompanyAdminDashboard />;
  if (roleName === "Trainer") return <TrainerDashboard />;
  if (roleName === "Sales Manager") return <SalesManagerDashboard />;
  if (roleName === "Sales Employee") return <SalesEmployeeDashboard />;

  return <SalesEmployeeDashboard />;
}

