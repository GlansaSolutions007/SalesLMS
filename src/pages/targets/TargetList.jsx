import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, targetEditPath } from "../../router/routePaths.js";

// Design-only data — see LeadPool.jsx's note on this module's UI-only scope.
const DUMMY_COMPANIES = [
  { id: 1, company_name: "Acme Sales Pvt Ltd" },
  { id: 2, company_name: "Northwind Traders" },
];

const DUMMY_TARGETS = [
  { id: 1, employee: { full_name: "Arjun Kumar" }, start_date: "2026-09-01", end_date: "2026-09-30", monthly_lead_target: 40, monthly_sales_target: 20, monthly_revenue_target: 1200000 },
  { id: 2, employee: { full_name: "Priya Singh" }, start_date: "2026-09-01", end_date: "2026-09-30", monthly_lead_target: 35, monthly_sales_target: 18, monthly_revenue_target: 1000000 },
  { id: 3, employee: { full_name: "Ravi Verma" }, start_date: "2026-08-01", end_date: "2026-08-31", monthly_lead_target: 30, monthly_sales_target: 15, monthly_revenue_target: 900000 },
];

function isEditable(target) {
  return new Date(target.end_date) >= new Date(new Date().toDateString());
}

export default function TargetList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const companies = DUMMY_COMPANIES;
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [allTargets, setAllTargets] = useState(DUMMY_TARGETS);
  const [toast, setToast] = useState(null);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);

  const targets = companyId ? allTargets : [];
  const pagination = { from: targets.length === 0 ? 0 : 1, to: targets.length, total: targets.length, current_page: 1, last_page: 1 };

  function confirmDelete() {
    setAllTargets((prev) => prev.filter((t) => t.id !== deleteTargetRow.id));
    setToast({ tone: "success", message: "Target deleted." });
    setDeleteTargetRow(null);
  }

  const columns = [
    { key: "employee", header: "Employee", render: (r) => r.employee?.full_name || "—" },
    { key: "period", header: "Period", render: (r) => `${r.start_date} to ${r.end_date}` },
    { key: "monthly_lead_target", header: "Lead Target" },
    { key: "monthly_sales_target", header: "Sales Target" },
    { key: "monthly_revenue_target", header: "Revenue Target", render: (r) => `₹${Number(r.monthly_revenue_target).toLocaleString()}` },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="cl-btn"
            disabled={!isEditable(r)}
            onClick={() => navigate(targetEditPath(companyId, r.id))}
          >
            Edit
          </button>
          <button type="button" className="cl-btn dt-danger" disabled={!isEditable(r)} onClick={() => setDeleteTargetRow(r)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Monthly Targets</h1>
            <Breadcrumb current="Targets" />
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
            <div className="dt-spacer" />
            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              onClick={() => navigate(ROUTES.TARGETS_ADD, { state: { companyId } })}
              disabled={!companyId}
            >
              Create Monthly Target
            </button>
          </div>

          <DataTable columns={columns} rows={targets} isLoading={false} emptyMessage="No monthly targets set yet." />

          {companyId && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} target{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={() => {}} />
            </div>
          )}
        </div>
      </div>

      {deleteTargetRow && (
        <ConfirmDialog
          title="Delete this target?"
          message={`This will permanently remove the target for ${deleteTargetRow.employee?.full_name}.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTargetRow(null)}
        />
      )}
    </>
  );
}
