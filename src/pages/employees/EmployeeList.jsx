import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmployeeTabs from "./EmployeeTabs.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyBranches from "../company/useCompanyBranches.js";
import useCompanyDepartments from "../company/useCompanyDepartments.js";
import useCompanyEmployees from "./useCompanyEmployees.js";
import { deactivateCompanyEmployee } from "../../services/api/companyApi.js";
import BulkUploadEmployeesModal from "./bulkUpload/BulkUploadEmployeesModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, employeeEditPath, employeeProfilePath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "../company/CompanyList.css";

const STATUS_TONE = { active: "green", inactive: "gray", resigned: "orange", terminated: "red" };
const STATUS_OPTIONS = ["All", "Active", "Inactive", "Resigned", "Terminated"];

const SORT_OPTIONS = [
  { key: "full_name", label: "Name" },
  { key: "employee_code", label: "Employee Code" },
  { key: "joining_date", label: "Join Date" },
];

const COLUMNS = [
  {
    key: "full_name",
    header: "Employee",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.full_name)}</span>
        <div>
          <p className="emp-name">{r.full_name}</p>
          <p className="emp-code">{r.employee_code}</p>
        </div>
      </div>
    ),
  },
  // { key: "department", header: "Department", render: (r) => r.department?.department_name || "—" },
  { key: "designation", header: "Designation", render: (r) => r.designation?.designation_name || "—" },
  { key: "email", header: "Email" },
  { key: "mobile", header: "Mobile", render: (r) => r.mobile || "—" },
  { key: "joining_date", header: "Join Date", render: (r) => (r.joining_date ? String(r.joining_date).slice(0, 10) : "—") },
  {
    key: "status",
    header: "Status",
    render: (r) => {
      const key = String(r.status ?? "").toLowerCase();
      return <Badge tone={STATUS_TONE[key] ?? "gray"}>{r.status || "—"}</Badge>;
    },
  },
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

export default function EmployeeList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  // "" is the default for Super Admin and means "All Companies", not "none picked yet".
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const isAllSelected = isSuperAdmin && !companyId;

  const { branches } = useCompanyBranches(companyId);
  const { departments } = useCompanyDepartments(companyId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sort, setSort] = useState({ key: "full_name", dir: "asc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [companyId, search, statusFilter, branchFilter, departmentFilter, sort.key, sort.dir]);

  const { employees, pagination, isLoading, error, refetch } = useCompanyEmployees(
    companyId,
    {
      search: search.trim() || undefined,
      status: statusFilter !== "All" ? statusFilter : undefined,
      branch_id: branchFilter || undefined,
      department_id: departmentFilter || undefined,
      sort: sort.key,
      dir: sort.dir,
      page,
      per_page: 25,
    },
    isAllSelected ? companies : undefined
  );

  const [toastDismissed, setToastDismissed] = useState(false);
  const [toast, setToast] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateCompanyEmployee(deactivateTarget.company?.id ?? companyId, deactivateTarget.id, token);
      setDeactivateTarget(null);
      refetch();
      setToast({ tone: "success", message: "Employee deactivated successfully." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not deactivate this employee." });
    } finally {
      setDeactivating(false);
    }
  }

  const columns = [
    ...COLUMNS.slice(0, 1),
    ...(isAllSelected ? [{ key: "company", header: "Company", render: (r) => r.company?.company_name || "—" }] : []),
    ...COLUMNS.slice(1),
    {
      key: "actions",
      header: "",
      render: (r) => {
        const rowCompanyId = r.company?.id ?? companyId;
        return (
          <div className="cl-row-actions">
            <Link to={employeeProfilePath(rowCompanyId, r.id)} className="dash-icon-btn" aria-label={`View ${r.full_name}`}>
              <Icon name="eye" size={15} />
            </Link>
            <Link to={employeeEditPath(rowCompanyId, r.id)} className="dash-icon-btn" aria-label={`Edit ${r.full_name}`}>
              <Icon name="edit" size={15} />
            </Link>
            {r.status === "Active" && (
              <button
                type="button"
                className="dash-icon-btn"
                aria-label={`Deactivate ${r.full_name}`}
                title="Deactivate"
                onClick={() => setDeactivateTarget(r)}
              >
                {/* /deactive icon ban related */}
                <Icon name="ban" size={15} />
                {/* <Icon name="trash" size={15} /> */}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Employees</h1>
            <Breadcrumb current="All Employees" />
          </div>
          <div className="cl-actions">
            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              disabled={!companyId && !isAllSelected}
              onClick={() => navigate(ROUTES.EMPLOYEES_ADD, { state: { companyId: companyId || null } })}
            >
              <Icon name="plus" size={16} />
              Add New Employee
            </button>
            <button type="button" className="cl-btn" disabled={!companyId} onClick={() => setBulkUploadOpen(true)}>
              <Icon name="download" size={15} style={{ transform: "rotate(180deg)" }} />
              Bulk Upload Employees
            </button>
            <button
              type="button"
              className="cl-btn"
              disabled={!companyId && !isAllSelected}
              onClick={() => exportToCsv("employees.csv", employees, isAllSelected ? [COLUMNS[0], { key: "company", header: "Company", render: (r) => r.company?.company_name || "—" }, ...COLUMNS.slice(1)] : COLUMNS)}
            >
              <Icon name="download" size={15} />
              Export Excel
            </button>
          </div>
        </div>

        <EmployeeTabs />

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            {isSuperAdmin && (
              <select
                className="dt-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={companiesLoading || companies.length === 0}
                aria-label="Select company"
              >
                {companies.length === 0 && <option value="">No companies found</option>}
                {companies.length > 0 && <option value="">All Companies</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            )}

            <select
              className="dt-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              disabled={!companyId}
              aria-label="Filter by branch"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>

            {/* <select
              className="dt-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              disabled={!companyId}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select> */}
          </div>

          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search employees..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
          />

          <DataTable
            columns={columns}
            rows={employees}
            isLoading={isLoading || companiesLoading}
            emptyMessage={isAllSelected ? "No employees found." : companyId ? "No employees found for this company." : "Select a company to view its employees."}
          />

          {!isLoading && (companyId || isAllSelected) && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} employee{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate Employee"
          message={`This will deactivate ${deactivateTarget.full_name}. They can be reactivated later by editing their status.`}
          confirmLabel={deactivating ? "Deactivating…" : "Deactivate"}
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={confirmDeactivate}
        />
      )}

      {bulkUploadOpen && companyId && (
        <BulkUploadEmployeesModal
          companyId={companyId}
          onClose={() => setBulkUploadOpen(false)}
          onImported={() => {
            refetch();
            setToast({ tone: "success", message: "Bulk upload complete." });
          }}
        />
      )}

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
