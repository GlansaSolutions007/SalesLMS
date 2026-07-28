import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import Icon from "../../components/Icon.jsx";
import CompanyTabs from "./CompanyTabs.jsx";
import useCompanyOptions from "./useCompanyOptions.js";
import useCompanyBranches from "./useCompanyBranches.js";
import BranchFormModal from "./BranchFormModal.jsx";
import { getCompanyBranch } from "../../services/api/companyApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { companyBranchViewPath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "./CompanyList.css";

const STATUS_TONE = { active: "green", inactive: "gray" };
const STATUS_OPTIONS = ["All", "Active", "Inactive"];

const SORT_OPTIONS = [
  { key: "branch_name", label: "Name" },
  { key: "employees_count", label: "Employees" },
];

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const BASE_COLUMNS = [
  {
    key: "branch_name",
    header: "Branch",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.branch_name)}</span>
        <div>
          <p className="emp-name">{r.branch_name}</p>
          <p className="emp-code">{r.branch_code}</p>
        </div>
      </div>
    ),
  },
  {
    key: "location",
    header: "Location",
    render: (r) => [r.city, r.state, r.country].filter(Boolean).join(", ") || "—",
  },
  { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
  { key: "email", header: "Email", render: (r) => r.email || "—" },
  {
    key: "employees_count",
    header: "Employees",
    render: (r) => <span className="cl-numeric">{(r.employees_count ?? 0).toLocaleString()}</span>,
  },
  {
    key: "manager",
    header: "Manager",
    render: (r) =>
      r.manager ? (
        <div>
          <p className="emp-name">{r.manager.full_name}</p>
          <p className="emp-code">{r.manager.employee_code}</p>
        </div>
      ) : (
        <span style={{ fontSize: 13, color: "var(--color-muted)" }}>Unassigned</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => {
      const key = String(r.status ?? "").toLowerCase();
      return <Badge tone={STATUS_TONE[key] ?? "gray"}>{r.status || "—"}</Badge>;
    },
  },
];

function buildColumns(companyId, onEdit, editingRowId) {
  return [
    ...BASE_COLUMNS,
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <Link to={companyBranchViewPath(companyId, r.id)} className="dash-icon-btn" aria-label={`View ${r.branch_name}`}>
            <Icon name="eye" size={15} />
          </Link>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Edit ${r.branch_name}`}
            title="Edit"
            onClick={() => onEdit(r)}
            disabled={editingRowId === r.id}
          >
            <Icon name="edit" size={15} />
          </button>
        </div>
      ),
    },
  ];
}

export default function CompanyBranches() {
  const { toggleCollapsed } = useOutletContext();
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const { branches, isLoading, error, refetch } = useCompanyBranches(companyId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "branch_name", dir: "asc" });
  const [toastDismissed, setToastDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const [formModal, setFormModal] = useState(null); // { mode: "add" | "edit", branch } | null
  const [editingRowId, setEditingRowId] = useState(null);

  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  function openAdd() {
    setFormModal({ mode: "add", branch: null });
  }

  const openEdit = useCallback(
    async (row) => {
      setEditingRowId(row.id);
      try {
        const full = await getCompanyBranch(companyId, row.id, token);
        setFormModal({
          mode: "edit",
          branchId: row.id,
          branch: {
            branch_name: full.branch_name ?? "",
            branch_code: full.branch_code ?? "",
            address: full.address ?? "",
            city: full.city ?? "",
            state: full.state ?? "",
            country: full.country ?? "",
            pincode: full.pincode ?? "",
            phone: full.phone ?? "",
            email: full.email ?? "",
            manager_id: full.manager?.id ?? "",
          },
        });
      } catch (err) {
        setToast({ tone: "error", message: err.message ?? "Could not load this branch for editing." });
      } finally {
        setEditingRowId(null);
      }
    },
    [companyId, token]
  );

  function closeFormModal() {
    setFormModal(null);
  }

  function handleFormSuccess() {
    const wasEdit = formModal?.mode === "edit";
    closeFormModal();
    refetch();
    setToast({ tone: "success", message: wasEdit ? "Branch updated successfully." : "Branch created successfully." });
  }

  const rows = useMemo(() => {
    let list = branches;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) =>
        [b.branch_name, b.branch_code, b.city, b.manager?.full_name].some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "All") {
      list = list.filter((b) => String(b.status ?? "").toLowerCase() === statusFilter.toLowerCase());
    }

    list = [...list].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [branches, search, statusFilter, sort]);

  const columns = useMemo(() => buildColumns(companyId, openEdit, editingRowId), [companyId, editingRowId, openEdit]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Branches</h1>
            <Breadcrumb current="Branches" />
          </div>
        </div>

        <CompanyTabs />

        <div className="panel cl-panel">
          {isSuperAdmin && (
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
            </div>
          )}

          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search branches..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            onExportCsv={() => exportToCsv("branches.csv", rows, BASE_COLUMNS)}
            onExportPdf={() => window.print()}
            addLabel="Add Branch"
            onAdd={companyId ? openAdd : undefined}
          />

          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading || companiesLoading}
            emptyMessage={companyId ? "No branches found for this company." : "Select a company to view its branches."}
          />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {rows.length} of {branches.length} branch{branches.length === 1 ? "" : "es"}
              </p>
            </div>
          )}
        </div>
      </div>

      {formModal && (
        <BranchFormModal
          mode={formModal.mode}
          companyId={companyId}
          branchId={formModal.branchId}
          initialValues={formModal.branch}
          onClose={closeFormModal}
          onSuccess={handleFormSuccess}
        />
      )}

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
