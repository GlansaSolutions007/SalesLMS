import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import StatCard from "../../components/StatCard.jsx";

const STATUS_TONE = { pending: "orange", approved: "blue", paid: "green" };

// Design-only data — see LeadPool.jsx's note on this module's UI-only scope.
const DUMMY_MY_INCENTIVES = [
  { id: 1, period_month: "2026-09-01", verified_conversions_count: 27, verified_revenue: 1140000, calculated_amount: 57000, status: "Pending" },
  { id: 2, period_month: "2026-08-01", verified_conversions_count: 24, verified_revenue: 960000, calculated_amount: 48000, status: "Paid" },
  { id: 3, period_month: "2026-07-01", verified_conversions_count: 19, verified_revenue: 760000, calculated_amount: 38000, status: "Paid" },
];

export default function MyIncentives() {
  const { toggleCollapsed } = useOutletContext();
  const incentives = DUMMY_MY_INCENTIVES;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const current = incentives.find((i) => String(i.period_month).slice(0, 7) === currentMonth) ?? incentives[0];

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

        {current && (
          <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
            <StatCard icon="coin" label="This Month's Incentive" value={`₹${Number(current.calculated_amount).toLocaleString()}`} tone="green" />
            <StatCard icon="check" label="Verified Conversions" value={current.verified_conversions_count} tone="blue" />
          </div>
        )}

        <div className="panel cl-panel">
          <DataTable columns={columns} rows={incentives} isLoading={false} emptyMessage="No incentive history yet." />
        </div>
      </div>
    </>
  );
}
