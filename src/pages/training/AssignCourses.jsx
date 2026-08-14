import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import TrainingSectionTabs from "./TrainingSectionTabs.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyCourseAssignments from "./useCompanyCourseAssignments.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { STATUS_OPTIONS } from "./assignCourseData.js";
import { ROUTES } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "../company/CompanyList.css";

const STATUS_TONE = { Assigned: "blue", "In Progress": "orange", Completed: "green", Expired: "red" };
const STATUS_FILTER_OPTIONS = ["All", ...STATUS_OPTIONS];

// The course-assignments endpoint always orders by created_at desc — it has
// no `sort`/`dir` query params — so sorting here is applied client-side to
// the current page of results rather than sent to the server.
const SORT_OPTIONS = [
  { key: "employee", label: "Employee" },
  { key: "course", label: "Course" },
  { key: "due_date", label: "Due Date" },
];

function sortValue(row, key) {
  if (key === "employee") return row.employee?.full_name ?? "";
  if (key === "course") return row.course?.course_name ?? "";
  if (key === "due_date") return row.due_date ?? "";
  return "";
}

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// exportToCsv reads row[column.key] directly (no render support), so nested
// employee/course/batch fields need flattening before export.
const CSV_COLUMNS = [
  { key: "employeeName", header: "Employee" },
  { key: "employeeCode", header: "Employee Code" },
  { key: "courseName", header: "Course" },
  { key: "batchName", header: "Batch" },
  { key: "assigned_date", header: "Assigned Date" },
  { key: "due_date", header: "Due Date" },
  { key: "status", header: "Status" },
];

function toCsvRow(r) {
  return {
    employeeName: r.employee?.full_name ?? "",
    employeeCode: r.employee?.employee_code ?? "",
    courseName: r.course?.course_name ?? "",
    batchName: r.batch?.batch_name ?? "",
    assigned_date: r.assigned_date ? String(r.assigned_date).slice(0, 10) : "",
    due_date: r.due_date ? String(r.due_date).slice(0, 10) : "",
    status: r.status ?? "",
  };
}

const COLUMNS = [
  {
    key: "employee",
    header: "Employee",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.employee?.full_name)}</span>
        <div>
          <p className="emp-name">{r.employee?.full_name || "—"}</p>
          <p className="emp-code">{r.employee?.employee_code || "—"}</p>
        </div>
      </div>
    ),
  },
  { key: "course", header: "Course", render: (r) => <b>{r.course?.course_name || "—"}</b> },
  { key: "batch", header: "Batch", render: (r) => r.batch?.batch_name || "—" },
  { key: "assigned_date", header: "Assigned Date", render: (r) => (r.assigned_date ? String(r.assigned_date).slice(0, 10) : "—") },
  { key: "due_date", header: "Due Date", render: (r) => (r.due_date ? String(r.due_date).slice(0, 10) : "—") },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
];

export default function AssignCourses() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  // Employees only ever view courses assigned to them — assigning a course
  // to someone is an admin/trainer action, so the Add button is hidden here
  // rather than relying solely on the backend rejecting the POST.
  const canAssignCourses = roleName !== "Employee";

  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "employee", dir: "asc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [companyId, search, statusFilter]);

  const { assignments, pagination, isLoading, error } = useCompanyCourseAssignments(companyId, {
    search: search.trim() || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    page,
    per_page: 25,
  });

  const sortedAssignments = useMemo(() => {
    const rows = [...assignments];
    rows.sort((a, b) => {
      const cmp = String(sortValue(a, sort.key)).localeCompare(String(sortValue(b, sort.key)));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [assignments, sort]);

  const [toastDismissed, setToastDismissed] = useState(false);
  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Assign Courses</h1>
            <Breadcrumb current="Assign Courses" />
          </div>
        </div>

        <TrainingSectionTabs />

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
            searchPlaceholder="Search by employee name or code..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_FILTER_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            onExportCsv={() => exportToCsv("course-assignments.csv", sortedAssignments.map(toCsvRow), CSV_COLUMNS)}
            onExportPdf={() => window.print()}
            addLabel={canAssignCourses ? "Add New Assignment" : undefined}
            onAdd={canAssignCourses && companyId ? () => navigate(ROUTES.TRAINING_ASSIGN_COURSES_ADD) : undefined}
          />

          <DataTable
            columns={COLUMNS}
            rows={sortedAssignments}
            isLoading={isLoading || companiesLoading}
            emptyMessage={companyId ? "No course assignments found for this company." : "Select a company to view its course assignments."}
          />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} assignment{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
    </>
  );
}
