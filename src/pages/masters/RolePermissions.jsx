import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRole, getPermissions, getRolePermissions, syncRolePermissions } from "../../services/rolesService.js";
import { ROUTES } from "../../router/routePaths.js";
import "../company/CompanyView.css";
import "./RoleList.css";
import "./RolePermissions.css";

function groupByModule(permissions, search) {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? permissions.filter(
        (p) => p.permission_name?.toLowerCase().includes(q) || p.module_name?.toLowerCase().includes(q)
      )
    : permissions;

  const map = {};
  filtered.forEach((p) => {
    const mod = p.module_name || "General";
    if (!map[mod]) map[mod] = [];
    map[mod].push(p);
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

export default function RolePermissions() {
  const { roleId } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | error | success
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [search, setSearch] = useState("");
  const [collapsedModules, setCollapsedModules] = useState(new Set());

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Load role + all permissions + role's assigned permissions ──────────────
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage("");

    Promise.all([getRole(roleId, token), getPermissions(token), getRolePermissions(roleId, token)])
      .then(([roleRes, permsRes, rolePermsRes]) => {
        if (cancelled) return;

        const roleData = roleRes.data?.data;
        const allPerms = permsRes.data?.data?.data ?? permsRes.data?.data ?? [];
        const assigned = rolePermsRes.data?.data?.permissions ?? [];
        const ids = new Set(assigned.map((p) => p.id));

        setRole(roleData);
        setPermissions(Array.isArray(allPerms) ? allPerms : []);
        setAssignedIds(ids);
        setSelectedIds(new Set(ids));
        setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err.response?.data?.message ?? "Could not load this role's permissions.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [roleId, token, retryKey]);

  const groupedPerms = useMemo(() => groupByModule(permissions, search), [permissions, search]);

  const isDirty = useMemo(() => {
    if (selectedIds.size !== assignedIds.size) return true;
    for (const id of selectedIds) if (!assignedIds.has(id)) return true;
    return false;
  }, [selectedIds, assignedIds]);

  const allSelected = permissions.length > 0 && permissions.every((p) => selectedIds.has(p.id));

  function togglePerm(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleModule(perms) {
    const moduleAllSelected = perms.every((p) => selectedIds.has(p.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (moduleAllSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(permissions.map((p) => p.id)));
  }

  function toggleCollapse(module) {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  }

  function handleReset() {
    setSelectedIds(new Set(assignedIds));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await syncRolePermissions(roleId, [...selectedIds], token);
      setAssignedIds(new Set(selectedIds));
      setToast({ tone: "success", message: "Permissions updated successfully." });
    } catch (err) {
      setToast({ tone: "error", message: err.response?.data?.message ?? "Could not save permissions. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Role Permissions</h1>
            <Breadcrumb current="Manage Permissions" />
          </div>

          <div className="cv-header-actions">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.MASTERS_ROLES)}>
              <Icon name="back" size={15} />
              Back to Roles
            </button>
          </div>
        </div>

        {status === "loading" && <RolePermissionsSkeleton />}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this role's permissions</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && role && (
          <>
            <div className="panel cv-profile-card rp-role-card">
              <div className="cv-profile-info">
                <div className="cv-profile-title">
                  <h2>{role.role_name}</h2>
                  <Badge tone={role.status === "Active" ? "green" : "gray"}>{role.status ?? "—"}</Badge>
                </div>
                <p className="cv-profile-code">{role.description || "No description provided."}</p>
              </div>
              <span className="rl-perm-selected-count">
                {selectedIds.size} / {permissions.length} selected
              </span>
            </div>

            <div className="panel rp-perm-panel">
              <div className="rp-perm-toolbar">
                <div className="rl-perm-search-wrap rp-perm-search-wrap">
                  <Icon name="search" size={15} />
                  <input
                    type="text"
                    className="rl-perm-search"
                    placeholder="Search permissions…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <label className="rp-select-all">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  <span>Select All Permissions</span>
                </label>
              </div>

              {isDirty && (
                <div className="rp-unsaved-banner">
                  <Icon name="warning" size={14} />
                  <span>You have unsaved changes.</span>
                </div>
              )}

              <div className="rl-perm-groups rp-perm-groups">
                {groupedPerms.length === 0 ? (
                  <p className="rl-perm-empty">No permissions match your search.</p>
                ) : (
                  groupedPerms.map(([module, perms]) => {
                    const isCollapsed = collapsedModules.has(module);
                    const moduleAllSelected = perms.every((p) => selectedIds.has(p.id));
                    const moduleSomeSelected = perms.some((p) => selectedIds.has(p.id));
                    return (
                      <div key={module} className="rl-perm-group">
                        <div className="rl-perm-group-header rp-perm-group-header">
                          <input
                            type="checkbox"
                            checked={moduleAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = moduleSomeSelected && !moduleAllSelected;
                            }}
                            onChange={() => toggleModule(perms)}
                          />
                          <button type="button" className="rp-collapse-btn" onClick={() => toggleCollapse(module)}>
                            <Icon name="chevronDown" size={14} className={isCollapsed ? "rp-chevron-collapsed" : ""} />
                            <span>{module}</span>
                          </button>
                          <span className="rl-perm-group-count">
                            {perms.filter((p) => selectedIds.has(p.id)).length}/{perms.length}
                          </span>
                        </div>
                        {!isCollapsed && (
                          <div className="rl-perm-grid">
                            {perms.map((p) => (
                              <label key={p.id} className="rl-perm-item">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(p.id)}
                                  onChange={() => togglePerm(p.id)}
                                />
                                <span>{p.permission_name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {status === "success" && (
        <div className="rp-save-bar">
          <span className="rp-save-status">{isDirty ? "Unsaved changes" : "All changes saved"}</span>
          <div className="rp-save-actions">
            <button type="button" className="cl-btn" onClick={handleReset} disabled={!isDirty || saving}>
              Reset
            </button>
            <button type="button" className="dash-primary-btn cl-add-btn" onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}

function RolePermissionsSkeleton() {
  return (
    <>
      <div className="panel cv-profile-card">
        <div className="cv-profile-info">
          <Skeleton width="30%" height={22} />
          <Skeleton width="50%" height={14} className="cv-skeleton-gap" />
        </div>
      </div>
      <div className="panel rp-perm-panel">
        <Skeleton height={38} className="cv-skeleton-gap" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={90} className="cv-skeleton-gap" />
        ))}
      </div>
    </>
  );
}
