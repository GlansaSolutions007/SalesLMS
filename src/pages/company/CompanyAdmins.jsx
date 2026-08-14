import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Icon from "../../components/Icon.jsx";
import CompanyTabs from "./CompanyTabs.jsx";
import useCompanyOptions from "./useCompanyOptions.js";
import useCompanyAdmins from "./useCompanyAdmins.js";
import AdminFormModal from "./AdminFormModal.jsx";
import { toggleCompanyAdminStatus, resetCompanyAdminPassword } from "../../services/api/companyApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./CompanyList.css";

const STATUS_TONE = { Active: "green", Inactive: "gray", Suspended: "red" };

export default function CompanyAdmins() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(true);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    if (!companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [companies, companyId]);

  const { admins, isLoading, error, refetch } = useCompanyAdmins(companyId);

  const [formModal, setFormModal] = useState(null); // { mode, admin, adminId } | null
  const [statusTarget, setStatusTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const [toastDismissed, setToastDismissed] = useState(false);

  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  async function confirmToggleStatus() {
    if (!statusTarget) return;
    setActionLoading(true);
    try {
      await toggleCompanyAdminStatus(companyId, statusTarget.id, token);
      setStatusTarget(null);
      refetch();
      setToast({ tone: "success", message: "Admin status updated." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update status." });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    setActionLoading(true);
    try {
      const result = await resetCompanyAdminPassword(companyId, resetTarget.id, {}, token);
      setResetTarget(null);
      if (result?.temp_password) setResetPasswordResult(result.temp_password);
      else setToast({ tone: "success", message: "Password reset." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not reset password." });
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    {
      key: "name",
      header: "Admin",
      render: (r) => (
        <div>
          <p className="emp-name">{r.name}</p>
          <p className="emp-code">{r.username}</p>
        </div>
      ),
    },
    { key: "email", header: "Email" },
    { key: "mobile", header: "Mobile", render: (r) => r.mobile || "—" },
    { key: "last_login", header: "Last Login", render: (r) => (r.last_login ? String(r.last_login).slice(0, 16).replace("T", " ") : "Never") },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <button type="button" className="dash-icon-btn" aria-label={`Edit ${r.name}`} title="Edit" onClick={() => setFormModal({ mode: "edit", adminId: r.id, admin: { name: r.name, username: r.username, email: r.email, mobile: r.mobile ?? "" } })}>
            <Icon name="edit" size={15} />
          </button>
          <button type="button" className="dash-icon-btn" aria-label={`Reset password for ${r.name}`} title="Reset Password" onClick={() => setResetTarget(r)}>
            <Icon name="refresh" size={15} />
          </button>
          <button type="button" className="dash-icon-btn" aria-label={`Toggle status for ${r.name}`} title={r.status === "Active" ? "Deactivate" : "Activate"} onClick={() => setStatusTarget(r)}>
            <Icon name={r.status === "Active" ? "close" : "check"} size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Company Admins</h1>
            <Breadcrumb current="Admins" />
          </div>
        </div>

        <CompanyTabs />

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            <select
              className="dt-select"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={companiesLoading || companies.length === 0}
              aria-label="Select company"
            >
              {companies.length === 0 && <option value="">No companies found</option>}
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              disabled={!companyId}
              onClick={() => setFormModal({ mode: "add", admin: null })}
              style={{ marginLeft: "auto" }}
            >
              <Icon name="plus" size={15} />
              Add Admin
            </button>
          </div>

          <DataTable
            columns={columns}
            rows={admins}
            isLoading={isLoading || companiesLoading}
            emptyMessage={companyId ? "No admins found for this company." : "Select a company to view its admins."}
          />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>Showing {admins.length} admin{admins.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      </div>

      {formModal && (
        <AdminFormModal
          mode={formModal.mode}
          companyId={companyId}
          adminId={formModal.adminId}
          initialValues={formModal.admin}
          onClose={() => setFormModal(null)}
          onSuccess={() => {
            const wasEdit = formModal?.mode === "edit";
            setFormModal(null);
            refetch();
            setToast({ tone: "success", message: wasEdit ? "Admin updated successfully." : "Admin created successfully." });
          }}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={statusTarget.status === "Active" ? "Deactivate Admin" : "Activate Admin"}
          message={`This will ${statusTarget.status === "Active" ? "deactivate" : "activate"} ${statusTarget.name}'s account.`}
          confirmLabel={actionLoading ? "Saving…" : "Confirm"}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmToggleStatus}
        />
      )}

      {resetTarget && (
        <ConfirmDialog
          title="Reset Password"
          message={`This will generate a new temporary password for ${resetTarget.name}.`}
          confirmLabel={actionLoading ? "Resetting…" : "Reset Password"}
          onCancel={() => setResetTarget(null)}
          onConfirm={confirmResetPassword}
        />
      )}

      {resetPasswordResult && (
        <ConfirmDialog
          title="New Temporary Password"
          message={`Share this password securely — it will not be shown again: ${resetPasswordResult}`}
          confirmLabel="Done"
          onCancel={() => setResetPasswordResult(null)}
          onConfirm={() => setResetPasswordResult(null)}
        />
      )}

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
