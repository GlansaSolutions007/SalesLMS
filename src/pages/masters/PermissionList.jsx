import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import MastersTabs from "./MastersTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getPermissionsPaginated,
  getPermissionModules,
  createPermission,
  updatePermission,
  togglePermissionStatus,
  deletePermission,
} from "../../services/rolesService.js";
import "./RoleList.css";

const STATUS_TONE = { Active: "green", Inactive: "gray" };
const PER_PAGE = 25;
const EMPTY_FORM = { permission_name: "", module_name: "", description: "" };

const COLUMNS = [
  { key: "permission_name", header: "Permission", render: (r) => <b style={{ color: "var(--color-heading)" }}>{r.permission_name}</b> },
  { key: "module_name", header: "Module" },
  { key: "description", header: "Description", render: (r) => <span style={{ color: "var(--color-muted)", fontSize: 13 }}>{r.description || "—"}</span> },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
  { key: "roles_count", header: "Roles Using It", render: (r) => <span className="rl-count-badge">{r.roles_count ?? 0}</span> },
];

export default function PermissionList() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();

  const [permissions, setPermissions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modules, setModules] = useState([]);

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, moduleFilter, statusFilter]);

  useEffect(() => {
    getPermissionModules(token)
      .then((res) => setModules(res.data?.data ?? []))
      .catch(() => setModules([]));
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setApiError(null);
      try {
        const params = { per_page: PER_PAGE, page };
        if (debouncedSearch) params.search = debouncedSearch;
        if (moduleFilter) params.module = moduleFilter;
        if (statusFilter) params.status = statusFilter;
        const res = await getPermissionsPaginated(params, token);
        if (cancelled) return;
        const body = res.data?.data;
        setPermissions(Array.isArray(body?.data) ? body.data : []);
        setPagination(body?.pagination ?? null);
      } catch {
        if (!cancelled) setApiError("Could not load permissions. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, debouncedSearch, moduleFilter, statusFilter, page, refreshKey]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setModalMode("add");
  }

  function openEdit(row) {
    setForm({ permission_name: row.permission_name ?? "", module_name: row.module_name ?? "", description: row.description ?? "" });
    setFormErrors({});
    setEditingId(row.id);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.permission_name.trim()) errors.permission_name = "Permission name is required.";
    if (!form.module_name.trim()) errors.module_name = "Module name is required.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      permission_name: form.permission_name.trim(),
      module_name: form.module_name.trim(),
      description: form.description.trim() || null,
    };

    setSaving(true);
    try {
      if (modalMode === "add") {
        await createPermission(payload, token);
      } else {
        await updatePermission(editingId, payload, token);
      }
      closeModal();
      setRefreshKey((k) => k + 1);
      setToast({ tone: "success", message: modalMode === "add" ? "Permission created." : "Permission updated." });
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        Object.entries(apiErrors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setFormErrors(mapped);
      } else {
        setFormErrors({ _api: `Failed to ${modalMode === "add" ? "create" : "update"} permission. Please try again.` });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(row) {
    setTogglingId(row.id);
    try {
      await togglePermissionStatus(row.id, token);
      setPermissions((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" } : p)));
    } catch {
      setToast({ tone: "error", message: "Could not update status." });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    try {
      await deletePermission(deletingId, token);
      setPermissions((prev) => prev.filter((p) => p.id !== deletingId));
      setPagination((p) => (p ? { ...p, total: Math.max(0, p.total - 1) } : p));
      setToast({ tone: "success", message: "Permission deactivated." });
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not deactivate this permission." });
    } finally {
      setDeletingId(null);
    }
  }

  const tableColumns = useMemo(
    () => [
      ...COLUMNS,
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="cl-row-actions">
            <button type="button" className="dash-icon-btn" aria-label={`Edit ${row.permission_name}`} title="Edit" onClick={() => openEdit(row)}>
              <Icon name="edit" size={15} />
            </button>
            <button
              type="button"
              className={`dash-icon-btn rl-toggle-btn${row.status === "Active" ? " rl-toggle-active" : " rl-toggle-inactive"}`}
              aria-label={`${row.status === "Active" ? "Deactivate" : "Activate"} ${row.permission_name}`}
              title={row.status === "Active" ? "Deactivate" : "Activate"}
              onClick={() => handleToggleStatus(row)}
              disabled={togglingId === row.id}
            >
              <Icon name={row.status === "Active" ? "check" : "close"} size={15} />
            </button>
            <button type="button" className="dash-icon-btn" aria-label={`Delete ${row.permission_name}`} title="Delete" onClick={() => setDeletingId(row.id)}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        ),
      },
    ],
    [togglingId]
  );

  const totalPages = pagination?.last_page ?? 1;
  const from = pagination?.from ?? 0;
  const to = pagination?.to ?? 0;
  const total = pagination?.total ?? 0;

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Permissions</h1>
            <Breadcrumb current="All Permissions" />
          </div>
        </div>

        <MastersTabs />

        <div className="panel cl-panel">
          <div className="dt-toolbar">
            <div className="cl-search dt-search">
              <Icon name="search" size={16} />
              <input type="text" placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <select className="dt-select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="dt-spacer" />

            {total > 0 && (
              <span style={{ fontSize: 13, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                {total} permission{total !== 1 ? "s" : ""}
              </span>
            )}

            <button type="button" className="dash-primary-btn cl-add-btn" onClick={openAdd}>
              <Icon name="plus" size={16} />
              Add Permission
            </button>
          </div>

          {apiError && <p className="rl-api-error">{apiError}</p>}

          <DataTable columns={tableColumns} rows={permissions} isLoading={isLoading} emptyMessage="No permissions found." />

          {!isLoading && total > 0 && (
            <div className="cl-footer">
              <p>Showing {from}–{to} of {total} permissions</p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add Permission" : "Edit Permission"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" form="perm-form" className="dash-primary-btn cl-add-btn" disabled={saving}>
                {saving ? (modalMode === "add" ? "Creating…" : "Saving…") : modalMode === "add" ? "Create Permission" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="perm-form" onSubmit={handleSubmit}>
            {formErrors._api && <p className="rl-api-error">{formErrors._api}</p>}

            <FormField label="Permission Name" error={formErrors.permission_name}>
              <input
                type="text"
                value={form.permission_name}
                onChange={(e) => setForm((f) => ({ ...f, permission_name: e.target.value }))}
                placeholder="e.g. employees.view"
              />
            </FormField>

            <FormField label="Module Name" error={formErrors.module_name}>
              <input
                type="text"
                list="perm-module-list"
                value={form.module_name}
                onChange={(e) => setForm((f) => ({ ...f, module_name: e.target.value }))}
                placeholder="e.g. Employees"
              />
              <datalist id="perm-module-list">
                {modules.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What this permission grants access to"
              />
            </FormField>
          </form>
        </Modal>
      )}

      {deletingId !== null && (
        <ConfirmDialog
          title="Deactivate Permission"
          message="This will deactivate the permission. If any active roles are still using it, deactivation will be blocked until it's removed from those roles."
          onCancel={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
