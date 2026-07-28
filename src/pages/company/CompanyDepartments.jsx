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
import useCompanyDepartments from "./useCompanyDepartments.js";
import DepartmentFormModal from "./DepartmentFormModal.jsx";
import { getCompanyDepartment } from "../../services/api/companyApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { companyDepartmentViewPath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "./CompanyList.css";

const STATUS_TONE = { active: "green", inactive: "gray" };
const STATUS_OPTIONS = ["All", "Active", "Inactive"];

const SORT_OPTIONS = [
  { key: "department_name", label: "Name" },
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
    key: "department_name",
    header: "Department",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.department_name)}</span>
        <div>
          <p className="emp-name">{r.department_name}</p>
          <p className="emp-code">{r.department_code}</p>
        </div>
      </div>
    ),
  },
  {
    key: "branch",
    header: "Branch",
    render: (r) => r.branch?.branch_name || "—",
  },
  {
    key: "employees_count",
    header: "Employees",
    render: (r) => <span className="cl-numeric">{(r.employees_count ?? 0).toLocaleString()}</span>,
  },
  {
    key: "head",
    header: "Department Head",
    render: (r) =>
      r.head ? (
        <div>
          <p className="emp-name">{r.head.full_name}</p>
          <p className="emp-code">{r.head.employee_code}</p>
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
          <Link to={companyDepartmentViewPath(companyId, r.id)} className="dash-icon-btn" aria-label={`View ${r.department_name}`}>
            <Icon name="eye" size={15} />
          </Link>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Edit ${r.department_name}`}
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

export default function CompanyDepartments() {
  const { toggleCollapsed } = useOutletContext();
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const { departments, isLoading, error, refetch } = useCompanyDepartments(companyId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "department_name", dir: "asc" });
  const [toastDismissed, setToastDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const [formModal, setFormModal] = useState(null); // { mode: "add" | "edit", department } | null
  const [editingRowId, setEditingRowId] = useState(null);

  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  function openAdd() {
    setFormModal({ mode: "add", department: null });
  }

  const openEdit = useCallback(
    async (row) => {
      setEditingRowId(row.id);
      try {
        const full = await getCompanyDepartment(companyId, row.id, token);
        setFormModal({
          mode: "edit",
          departmentId: row.id,
          department: {
            department_name: full.department_name ?? "",
            department_code: full.department_code ?? "",
            description: full.description ?? "",
            branch_id: full.branch?.id ?? "",
            department_head: full.head?.id ?? "",
          },
        });
      } catch (err) {
        setToast({ tone: "error", message: err.message ?? "Could not load this department for editing." });
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
    setToast({ tone: "success", message: wasEdit ? "Department updated successfully." : "Department created successfully." });
  }

  const rows = useMemo(() => {
    let list = departments;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) =>
        [d.department_name, d.department_code, d.branch?.branch_name, d.head?.full_name].some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "All") {
      list = list.filter((d) => String(d.status ?? "").toLowerCase() === statusFilter.toLowerCase());
    }

    list = [...list].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [departments, search, statusFilter, sort]);

  const columns = useMemo(() => buildColumns(companyId, openEdit, editingRowId), [companyId, editingRowId, openEdit]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Departments</h1>
            <Breadcrumb current="Departments" />
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
            searchPlaceholder="Search departments..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            onExportCsv={() => exportToCsv("departments.csv", rows, BASE_COLUMNS)}
            onExportPdf={() => window.print()}
            addLabel="Add Department"
            onAdd={companyId ? openAdd : undefined}
          />

          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading || companiesLoading}
            emptyMessage={companyId ? "No departments found for this company." : "Select a company to view its departments."}
          />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {rows.length} of {departments.length} department{departments.length === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      </div>

      {formModal && (
        <DepartmentFormModal
          mode={formModal.mode}
          companyId={companyId}
          departmentId={formModal.departmentId}
          initialValues={formModal.department}
          onClose={closeFormModal}
          onSuccess={handleFormSuccess}
        />
      )}

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
