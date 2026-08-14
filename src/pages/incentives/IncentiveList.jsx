import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import { getCompanyIncentives, updateIncentiveStatus } from "../../services/api/incentivesApi.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_TONE = { pending: "orange", approved: "blue", paid: "green" };
const STATUSES = ["Pending", "Approved", "Paid"];

export default function IncentiveList() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [incentives, setIncentives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setIncentives([]);
      return;
    }
    setIsLoading(true);
    getCompanyIncentives(companyId, { status: statusFilter !== "All" ? statusFilter : undefined })
      .then((res) => setIncentives(res.items))
      .catch(() => setIncentives([]))
      .finally(() => setIsLoading(false));
  }, [companyId, statusFilter, refreshKey]);

  async function handleStatusChange(row, status) {
    try {
      await updateIncentiveStatus(companyId, row.id, status);
      setToast({ tone: "success", message: `Incentive marked ${status}.` });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update status." });
    }
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

          <DataTable columns={columns} rows={incentives} isLoading={isLoading} emptyMessage="No incentives recorded yet." />
        </div>
      </div>
    </>
  );
}
