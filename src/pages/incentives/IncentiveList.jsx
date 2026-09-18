import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_TONE = { pending: "orange", approved: "blue", paid: "green" };
const STATUSES = ["Pending", "Approved", "Paid"];

// Design-only data — see LeadPool.jsx's note on this module's UI-only scope.
const DUMMY_COMPANIES = [
  { id: 1, company_name: "Acme Sales Pvt Ltd" },
  { id: 2, company_name: "Northwind Traders" },
];

const DUMMY_INCENTIVES = [
  { id: 1, employee: { full_name: "Arjun Kumar" }, period_month: "2026-09-01", verified_conversions_count: 27, verified_revenue: 1140000, calculated_amount: 57000, status: "Pending" },
  { id: 2, employee: { full_name: "Priya Singh" }, period_month: "2026-09-01", verified_conversions_count: 31, verified_revenue: 1120000, calculated_amount: 56000, status: "Approved" },
  { id: 3, employee: { full_name: "Ravi Verma" }, period_month: "2026-08-01", verified_conversions_count: 22, verified_revenue: 880000, calculated_amount: 44000, status: "Paid" },
];

export default function IncentiveList() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const companies = DUMMY_COMPANIES;
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [allIncentives, setAllIncentives] = useState(DUMMY_INCENTIVES);
  const [statusFilter, setStatusFilter] = useState("All");
  const [toast, setToast] = useState(null);

  const incentives = useMemo(() => {
    if (!companyId) return [];
    return allIncentives.filter((i) => statusFilter === "All" || i.status === statusFilter);
  }, [allIncentives, companyId, statusFilter]);

  function handleStatusChange(row, status) {
    setAllIncentives((prev) => prev.map((i) => (i.id === row.id ? { ...i, status } : i)));
    setToast({ tone: "success", message: `Incentive marked ${status}.` });
  }

  const columns = [
    { key: "employee", header: "Employee", render: (r) => r.employee?.full_name || "—" },
    { key: "period_month", header: "Period", render: (r) => String(r.period_month).slice(0, 7) },
    { key: "verified_conversions_count", header: "Verified Conversions" },
    { key: "verified_revenue", header: "Verified Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
    { key: "calculated_amount", header: "Incentive Amount", render: (r) => `₹${Number(r.calculated_amount).toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <select className="dt-select" value={r.status} onChange={(e) => handleStatusChange(r, e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Monthly Incentives</h1>
            <Breadcrumb current="Incentives" />
          </div>
        </div>

        {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}

        <div className="panel cl-panel">
          <div className="dt-toolbar">
            {isSuperAdmin && (
              <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            )}
            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {["All", ...STATUSES].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <DataTable columns={columns} rows={incentives} isLoading={false} emptyMessage="No incentives recorded yet." />
        </div>
      </div>
    </>
  );
}
