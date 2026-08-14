import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import StatCard from "../../components/StatCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyIncentives } from "../../services/api/incentivesApi.js";

const STATUS_TONE = { pending: "orange", approved: "blue", paid: "green" };

export default function MyIncentives() {
  const { toggleCollapsed } = useOutletContext();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [incentives, setIncentives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    getMyIncentives(companyId)
      .then(setIncentives)
      .catch(() => setIncentives([]))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const current = incentives.find((i) => String(i.period_month).slice(0, 7) === currentMonth);

  const columns = [
    { key: "period_month", header: "Period", render: (r) => String(r.period_month).slice(0, 7) },
    { key: "verified_conversions_count", header: "Verified Conversions" },
    { key: "verified_revenue", header: "Verified Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
    { key: "calculated_amount", header: "Amount", render: (r) => `₹${Number(r.calculated_amount).toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>My Incentives</h1>
            <Breadcrumb current="Incentives" />
          </div>
        </div>

        {!isLoading && current && (
          <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
            <StatCard icon="coin" label="This Month's Incentive" value={`₹${Number(current.calculated_amount).toLocaleString()}`} tone="green" />
            <StatCard icon="check" label="Verified Conversions" value={current.verified_conversions_count} tone="blue" />
          </div>
        )}

        <div className="panel cl-panel">
          <DataTable columns={columns} rows={incentives} isLoading={isLoading} emptyMessage="No incentive history yet." />
        </div>
      </div>
    </>
  );
}
