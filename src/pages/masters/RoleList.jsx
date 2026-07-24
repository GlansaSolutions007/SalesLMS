import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import MastersTabs from "./MastersTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoles, createRole, getPermissions } from "../../services/rolesService.js";
import "./RoleList.css";

const STATUS_TONE = { Active: "green", Inactive: "gray" };

const COLUMNS = [
  {
    key: "role_name",
    header: "Role Name",
    render: (r) => <b style={{ color: "var(--color-heading)" }}>{r.role_name}</b>,
  },
  {
    key: "description",
    header: "Description",
    render: (r) => (
      <span style={{ color: "var(--color-muted)", fontSize: 13 }}>{r.description || "—"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge>,
  },
  {
    key: "users_count",
    header: "Users",
    render: (r) => <span className="rl-count-badge">{r.users_count}</span>,
  },
  {
    key: "permissions_count",
    header: "Permissions",
    render: (r) => <span className="rl-count-badge">{r.permissions_count}</span>,
  },
  {
    key: "created_at",
    header: "Created",
    render: (r) =>
      r.created_at
        ? new Date(r.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
  },
];

const PER_PAGE = 25;
const EMPTY_FORM = { role_name: "", description: "" };

export default function RoleList() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();

  // ── List state ──────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Modal / form state ───────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());

  // ── Permissions (for the create form) ───────────────────────────────────────
  const [permissions, setPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsError, setPermsError] = useState(null);
  const [permSearch, setPermSearch] = useState("");

  // ── Debounce role search ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  // ── Fetch roles list ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setApiError(null);
      try {
        const params = { per_page: PER_PAGE, page };
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter) params.status = statusFilter;

        const res = await getRoles(params, token);
        if (cancelled) return;

        const body = res.data?.data;
        setRoles(Array.isArray(body?.data) ? body.data : []);
        setPagination(body?.pagination ?? null);
      } catch {
        if (!cancelled) setApiError("Could not load roles. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, debouncedSearch, statusFilter, page, refreshKey]);

  // ── Fetch permissions list (once, when modal first opens) ────────────────────
  async function loadPermissions() {
    setPermsLoading(true);
    setPermsError(null);
    try {
      const res = await getPermissions(token);
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data;
      setPermissions(Array.isArray(raw) ? raw : []);
    } catch {
      setPermsError("Could not load permissions.");
    } finally {
      setPermsLoading(false);
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSelectedPermIds(new Set());
    setPermSearch("");
    setModalOpen(true);
    if (permissions.length === 0) loadPermissions();
  }

  function closeModal() {
    setModalOpen(false);
  }

  // ── Permission helpers ───────────────────────────────────────────────────────
  function togglePerm(id) {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleGroup(groupPerms) {
    const allSelected = groupPerms.every((p) => selectedPermIds.has(p.id));
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }

  // Group + filter permissions by module
  const groupedPerms = useMemo(() => {
    const q = permSearch.toLowerCase();
    const filtered = permissions.filter(
      (p) =>
        p.permission_name?.toLowerCase().includes(q) ||
        p.module_name?.toLowerCase().includes(q)
    );
    const map = {};
    filtered.forEach((p) => {
      const mod = p.module_name || "General";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, permSearch]);

  // ── Form submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.role_name.trim()) errors.role_name = "Role name is required.";
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    const payload = {
      role_name: form.role_name.trim(),
      description: form.description.trim(),
      permission_ids: [...selectedPermIds],
    };

    setSaving(true);
    try {
      await createRole(payload, token);
      closeModal();
      setRefreshKey((k) => k + 1);
    } catch {
      setFormErrors({ _api: "Failed to create role. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  // ── Derived list values ──────────────────────────────────────────────────────
  const totalPages = pagination?.last_page ?? 1;
  const from = pagination?.from ?? 0;
  const to = pagination?.to ?? 0;
  const total = pagination?.total ?? 0;

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
        user={{ name: "Admin", role: "Super Admin", initials: "SA" }}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Roles</h1>
            <Breadcrumb current="All Roles" />
          </div>
        </div>

        <MastersTabs />

        <div className="panel cl-panel">
          <div className="dt-toolbar">
            <div className="cl-search dt-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="dt-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="dt-spacer" />

            {total > 0 && (
              <span style={{ fontSize: 13, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                {total} role{total !== 1 ? "s" : ""}
              </span>
            )}

            <button type="button" className="dash-primary-btn cl-add-btn" onClick={openAdd}>
              <Icon name="plus" size={16} />
              Add New Role
            </button>
          </div>

          {apiError && <p className="rl-api-error">{apiError}</p>}

          <DataTable
            columns={COLUMNS}
            rows={roles}
            isLoading={isLoading}
            emptyMessage="No roles found."
          />

          {!isLoading && total > 0 && (
            <div className="cl-footer">
              <p>Showing {from}–{to} of {total} roles</p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* ── Create Role Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <Modal
          title="Add New Role"
          onClose={closeModal}
          size="lg"
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="submit"
                form="rl-form"
                className="dash-primary-btn cl-add-btn"
                disabled={saving}
              >
                {saving ? "Creating…" : "Create Role"}
              </button>
            </>
          }
        >
          <form id="rl-form" onSubmit={handleSubmit}>
            {formErrors._api && <p className="rl-api-error">{formErrors._api}</p>}

            <div className="rl-section-label">Role Details</div>

            <FormField label="Role Name" error={formErrors.role_name}>
              <input
                type="text"
                value={form.role_name}
                onChange={(e) => setForm((f) => ({ ...f, role_name: e.target.value }))}
                placeholder="e.g. Trainer"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this role's responsibilities"
              />
            </FormField>

            {/* ── Permissions section ─────────────────────────────────────────── */}
            <div className="rl-section-label" style={{ marginTop: 20 }}>
              Permissions
              {selectedPermIds.size > 0 && (
                <span className="rl-perm-selected-count">{selectedPermIds.size} selected</span>
              )}
            </div>

            {permsLoading && (
              <div className="rl-perm-state">
                <div className="rl-perm-spinner" />
                <span>Loading permissions…</span>
              </div>
            )}

            {permsError && !permsLoading && (
              <div className="rl-perm-state rl-perm-error">
                <span>{permsError}</span>
                <button type="button" className="cl-btn" onClick={loadPermissions} style={{ marginLeft: 10 }}>
                  Retry
                </button>
              </div>
            )}

            {!permsLoading && !permsError && permissions.length > 0 && (
              <>
                <div className="rl-perm-search-wrap">
                  <Icon name="search" size={15} />
                  <input
                    type="text"
                    className="rl-perm-search"
                    placeholder="Filter permissions…"
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                  />
                </div>

                <div className="rl-perm-groups">
                  {groupedPerms.length === 0 ? (
                    <p className="rl-perm-empty">No permissions match your filter.</p>
                  ) : (
                    groupedPerms.map(([module, perms]) => {
                      const allSelected = perms.every((p) => selectedPermIds.has(p.id));
                      const someSelected = perms.some((p) => selectedPermIds.has(p.id));
                      return (
                        <div key={module} className="rl-perm-group">
                          <label className="rl-perm-group-header">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={() => toggleGroup(perms)}
                            />
                            <span>{module}</span>
                            <span className="rl-perm-group-count">{perms.length}</span>
                          </label>
                          <div className="rl-perm-grid">
                            {perms.map((p) => (
                              <label key={p.id} className="rl-perm-item">
                                <input
                                  type="checkbox"
                                  checked={selectedPermIds.has(p.id)}
                                  onChange={() => togglePerm(p.id)}
                                />
                                <span>{p.permission_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {!permsLoading && !permsError && permissions.length === 0 && (
              <p className="rl-perm-empty">No permissions available.</p>
            )}
          </form>
        </Modal>
      )}
    </>
  );
}
