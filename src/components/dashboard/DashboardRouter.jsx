import { useAuth } from "../../context/AuthContext.jsx";
import useDashboardData from "./useDashboardData.js";
import Skeleton from "../Skeleton.jsx";
import Icon from "../Icon.jsx";
import SuperAdminDashboard from "./SuperAdminDashboard.jsx";
import CompanyAdminDashboard from "./CompanyAdminDashboard.jsx";
import TrainerDashboard from "./TrainerDashboard.jsx";
import SalesManagerDashboard from "./SalesManagerDashboard.jsx";
import SalesEmployeeDashboard from "./SalesEmployeeDashboard.jsx";

function DashboardSkeleton() {
  return (
    <div className="dash-body">
      <div className="dash-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={110} />
        ))}
      </div>
      <Skeleton height={280} className="cv-skeleton-gap" />
    </div>
  );
}

function DashboardError({ message, onRetry }) {
  return (
    <div className="dash-body">
      <div className="panel ep-state-panel">
        <Icon name="warning" size={28} />
        <h3>Couldn't load your dashboard</h3>
        <p>{message}</p>
        <button type="button" className="cl-btn" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function DashboardRouter() {
  const { roleName } = useAuth();
  const { data, isLoading, error, retry } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardError message={error} onRetry={retry} />;

  if (roleName === "Super Admin") return <SuperAdminDashboard data={data} />;
  if (roleName === "Company Admin") return <CompanyAdminDashboard data={data} />;
  if (roleName === "Trainer") return <TrainerDashboard data={data} />;
  if (roleName === "Sales Manager") return <SalesManagerDashboard data={data} />;
  if (roleName === "Sales Employee") return <SalesEmployeeDashboard data={data} />;

  return <SalesEmployeeDashboard data={data} />;
}
