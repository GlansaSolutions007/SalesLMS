import { useEffect, useState } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import Icon from "../../components/Icon.jsx";
import CompanyTabs from "./CompanyTabs.jsx";
import useCompaniesList from "./useCompaniesList.js";
import { ROUTES, companyViewPath, companyEditPath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "./CompanyList.css";

const STATUS_TONE = { active: "green", inactive: "gray" };

const STATUS_OPTIONS = ["All", "Active", "Inactive"];

const SORT_OPTIONS = [
  { key: "company_name", label: "Name" },
  { key: "employees_count", label: "Employees" },
  { key: "created_at", label: "Created Date" },
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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const COLUMNS = [
  {
    key: "company_name",
    header: "Company",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.company_name)}</span>
        <div>
          <p className="emp-name">{r.company_name}</p>
          <p className="emp-code">{r.company_code}</p>
        </div>
      </div>
    ),
  },
  { key: "email", header: "Email" },
  { key: "industry_type", header: "Industry" },
  {
    key: "employees_count",
    header: "Employees",
    render: (r) => <span className="cl-numeric">{(r.employees_count ?? 0).toLocaleString()}</span>,
  },
  { key: "branches_count", header: "Branches", render: (r) => <span className="cl-numeric">{r.branches_count ?? 0}</span> },
  { key: "departments_count", header: "Departments", render: (r) => <span className="cl-numeric">{r.departments_count ?? 0}</span> },
  {
    key: "plan",
    header: "Plan",
    render: (r) =>
      r.active_subscription?.plan?.plan_name ? (
        <Badge tone="blue">{r.active_subscription.plan.plan_name}</Badge>
      ) : (
        <span style={{ fontSize: 13, color: "var(--color-muted)" }}>No active plan</span>
      ),
  },
  { key: "created_at", header: "Created", render: (r) => formatDate(r.created_at) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status === "active" ? "Active" : "Inactive"}</Badge>,
  },
  {
    key: "actions",
    header: "",
    render: (r) => (
      <div className="cl-row-actions">
        <Link to={companyViewPath(r.id)} className="dash-icon-btn" aria-label={`View ${r.company_name}`}>
          <Icon name="eye" size={15} />
        </Link>
        <Link to={companyEditPath(r.id)} className="dash-icon-btn" aria-label={`Edit ${r.company_name}`}>
          <Icon name="edit" size={15} />
        </Link>
      </div>
    ),
  },
];

export default function CompanyList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const table = useCompaniesList();
  const [toastDismissed, setToastDismissed] = useState(false);

  useEffect(() => {
    if (table.error) setToastDismissed(false);
  }, [table.error]);

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Companies</h1>
            <Breadcrumb current="All Companies" />
          </div>
        </div>

        <CompanyTabs />

        <div className="panel cl-panel">
          <DataToolbar
            search={table.search}
            onSearchChange={table.setSearch}
            searchPlaceholder="Search companies..."
            statusFilter={table.statusFilter}
            onStatusFilterChange={table.setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sort={table.sort}
            onSortChange={table.setSort}
            sortOptions={SORT_OPTIONS}
            addLabel="Add New Company"
            onAdd={() => navigate(ROUTES.COMPANY_ADD)}
            onExportCsv={() => exportToCsv("companies.csv", table.items, COLUMNS.filter((c) => c.key !== "actions"))}
            onExportPdf={() => window.print()}
          />

          <DataTable columns={COLUMNS} rows={table.items} isLoading={table.isLoading} emptyMessage="No companies match your search." />

          {!table.isLoading && table.total > 0 && (
            <div className="cl-footer">
              <p>
                Showing {table.from}–{table.to} of {table.total} companies
              </p>
              <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
            </div>
          )}
        </div>
      </div>

      <Toast tone="error" message={!toastDismissed ? table.error : ""} onDismiss={() => setToastDismissed(true)} />
    </>
  );
}
