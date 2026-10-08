import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
// This page hand-rolls its toolbar with the shared dt-toolbar/dt-select/
// dt-spacer/dt-danger classes rather than the <DataToolbar/> component, but
// still needs its stylesheet directly — otherwise the toolbar only renders
// correctly when another page that already imports it (e.g. Leads) has been
// visited first in the same session. See MyAssignedLeads.jsx for the same fix.
import "../../components/DataToolbar.css";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyTargets from "./useCompanyTargets.js";
import { deleteTarget } from "../../services/api/targetsApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, targetEditPath } from "../../router/routePaths.js";
import ImportPreviousAchievementModal from "./ImportPreviousAchievementModal.jsx";

function isEditable(target) {
  return new Date(target.end_date) >= new Date(new Date().toDateString());
}

export default function TargetList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies, isLoading: companiesLoading } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { targets, pagination, isLoading, refetch } = useCompanyTargets(companyId, { page, per_page: 25 });

  async function confirmDelete() {
    try {
      await deleteTarget(companyId, deleteTargetRow.id);
      setToast({ tone: "success", message: "Target deleted." });
      refetch();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete this target." });
    } finally {
      setDeleteTargetRow(null);
    }
  }

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

  const columns = [
    { key: "employee", header: "Employee", render: (r) => r.employee?.full_name || "—" },
    { key: "period", header: "Period", render: (r) =>  `${formatDate(r.start_date)} – ${formatDate(r.end_date)}` },
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
              <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={companiesLoading}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            )}
            <div className="dt-spacer" />
            <button type="button" className="cl-btn" onClick={() => setShowImportModal(true)} disabled={!companyId}>
              Import Previous Achievement
            </button>
            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              onClick={() => navigate(ROUTES.TARGETS_ADD, { state: { companyId } })}
              disabled={!companyId}
            >
              Create Monthly Target
            </button>
          </div>

          <DataTable columns={columns} rows={targets} isLoading={isLoading || companiesLoading} emptyMessage="No monthly targets set yet." />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} target{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
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

      {showImportModal && (
        <ImportPreviousAchievementModal
          companyId={companyId}
          onClose={() => setShowImportModal(false)}
          onImported={refetch}
        />
      )}
    </>
  );
}
