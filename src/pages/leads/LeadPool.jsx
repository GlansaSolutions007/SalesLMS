import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import ImportLeadsModal from "./components/ImportLeadsModal.jsx";
import AssignLeadsModal from "./components/AssignLeadsModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, leadViewPath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";

// Design-only data — the Sales Performance module renders from this fixed
// set instead of the real leads API, per the "UI design only" scope for
// this project (see EmployeeTargetPerformance.jsx's own note for the same
// reasoning). Shape matches exactly what the backend previously returned,
// so every column/filter below is unmodified from the live version.
const DUMMY_COMPANIES = [
  { id: 1, company_name: "Acme Sales Pvt Ltd" },
  { id: 2, company_name: "Northwind Traders" },
];

const DUMMY_EMPLOYEES = [
  { id: 101, full_name: "Arjun Kumar" },
  { id: 102, full_name: "Priya Singh" },
  { id: 103, full_name: "Ravi Verma" },
];

const DUMMY_LEADS = [
  { id: 1, lead_code: "LD-1001", full_name: "Karan Mehta", company_name: "Mehta Textiles", mobile: "9876543210", lead_source: "Manual Entry", priority: "High", assigned_employee: { full_name: "Arjun Kumar" }, status: "New", next_follow_up_date: "2026-09-20", verification_status: "Pending", created_at: "2026-09-10T10:00:00Z" },
  { id: 2, lead_code: "LD-1002", full_name: "Sneha Rao", company_name: "Rao Enterprises", mobile: "9876543211", lead_source: "Excel Import", priority: "Medium", assigned_employee: { full_name: "Priya Singh" }, status: "Contacted", next_follow_up_date: "2026-09-22", verification_status: "Pending", created_at: "2026-09-11T10:00:00Z" },
  { id: 3, lead_code: "LD-1003", full_name: "Vikram Joshi", company_name: "Joshi & Sons", mobile: "9876543212", lead_source: "CSV Import", priority: "Low", assigned_employee: null, status: "Assigned", next_follow_up_date: "2026-09-18", verification_status: "Pending", created_at: "2026-09-09T10:00:00Z" },
  { id: 4, lead_code: "LD-1004", full_name: "Anita Desai", company_name: "Desai Motors", mobile: "9876543213", lead_source: "Manual Entry", priority: "High", assigned_employee: { full_name: "Ravi Verma" }, status: "Interested", next_follow_up_date: "2026-09-25", verification_status: "Approved", created_at: "2026-09-08T10:00:00Z" },
  { id: 5, lead_code: "LD-1005", full_name: "Rahul Nair", company_name: "Nair Logistics", mobile: "9876543214", lead_source: "Manual Entry", priority: "Medium", assigned_employee: { full_name: "Arjun Kumar" }, status: "Converted", next_follow_up_date: "—", verification_status: "Approved", created_at: "2026-09-05T10:00:00Z" },
  { id: 6, lead_code: "LD-1006", full_name: "Meera Iyer", company_name: "Iyer Consulting", mobile: "9876543215", lead_source: "Excel Import", priority: "Low", assigned_employee: null, status: "Closed Lost", next_follow_up_date: "—", verification_status: "Rejected", created_at: "2026-09-03T10:00:00Z" },
];

const STATUS_TONE = {
  new: "blue",
  assigned: "blue",
  contacted: "orange",
  "follow-up": "orange",
  interested: "purple",
  converted: "green",
  verified: "green",
  "closed lost": "red",
};
const STATUS_OPTIONS = ["All", "New", "Assigned", "Contacted", "Follow-up", "Interested", "Converted", "Verified", "Closed Lost"];
const SOURCE_OPTIONS = ["All", "Manual Entry", "Excel Import", "CSV Import"];
const PRIORITY_OPTIONS = ["All", "Low", "Medium", "High"];
const VERIFICATION_OPTIONS = ["All", "Pending", "More Information Required", "Approved", "Rejected"];
const PRIORITY_TONE = { high: "red", medium: "orange", low: "gray" };
const PER_PAGE = 25;

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const COLUMNS = [
  { key: "lead_code", header: "Lead Number", render: (r) => r.lead_code || "—" },
  { key: "full_name", header: "Customer Name" },
  { key: "company_name", header: "Company Name", render: (r) => r.company_name || "—" },
  { key: "mobile", header: "Mobile" },
  { key: "lead_source", header: "Source" },
  {
    key: "priority",
    header: "Priority",
    render: (r) => <Badge tone={PRIORITY_TONE[String(r.priority).toLowerCase()] ?? "gray"}>{r.priority || "Medium"}</Badge>,
  },
  {
    key: "assigned",
    header: "Assigned Employee",
    render: (r) => r.assigned_employee?.full_name || "Unassigned",
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge>,
  },
  { key: "next_follow_up_date", header: "Next Follow-up", render: (r) => r.next_follow_up_date || "—" },
  {
    key: "verification_status",
    header: "Verification",
    render: (r) => (r.verification_status ? <Badge tone={r.verification_status === "Approved" ? "green" : r.verification_status === "Rejected" ? "red" : "orange"}>{r.verification_status}</Badge> : "—"),
  },
  { key: "created_at", header: "Created Date", render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : "—") },
];

export default function LeadPool() {
  const navigate = useNavigate();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const companies = DUMMY_COMPANIES;
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const employees = DUMMY_EMPLOYEES;

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [allLeads, setAllLeads] = useState(DUMMY_LEADS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showImport, setShowImport] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [reassignLeadId, setReassignLeadId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [companyId, search, statusFilter, sourceFilter, priorityFilter, employeeFilter, verificationFilter, dateFrom, dateTo]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = allLeads.filter((l) => {
      if (term && !`${l.lead_code} ${l.full_name} ${l.company_name} ${l.mobile}`.toLowerCase().includes(term)) return false;
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (sourceFilter !== "All" && l.lead_source !== sourceFilter) return false;
      if (priorityFilter !== "All" && l.priority !== priorityFilter) return false;
      if (employeeFilter !== "All" && String(l.assigned_employee?.full_name) !== String(employees.find((e) => String(e.id) === String(employeeFilter))?.full_name)) return false;
      if (verificationFilter !== "All" && l.verification_status !== verificationFilter) return false;
      if (dateFrom && l.created_at < dateFrom) return false;
      if (dateTo && l.created_at > `${dateTo}T23:59:59Z`) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return ((av ?? 0) - (bv ?? 0)) * dir;
    });
  }, [allLeads, search, statusFilter, sourceFilter, priorityFilter, employeeFilter, verificationFilter, dateFrom, dateTo, sort, employees]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PER_PAGE));
  const leads = filteredLeads.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pagination = {
    from: filteredLeads.length === 0 ? 0 : (page - 1) * PER_PAGE + 1,
    to: Math.min(page * PER_PAGE, filteredLeads.length),
    total: filteredLeads.length,
    current_page: page,
    last_page: totalPages,
  };

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));
  }

  function handleExport() {
    exportToCsv(
      "leads.csv",
      filteredLeads.map((l) => ({
        lead_code: l.lead_code,
        full_name: l.full_name,
        company_name: l.company_name ?? "",
        mobile: l.mobile,
        lead_source: l.lead_source,
        priority: l.priority,
        assigned_employee: l.assigned_employee?.full_name ?? "Unassigned",
        status: l.status,
        verification_status: l.verification_status ?? "",
      })),
      [
        { key: "lead_code", header: "Lead Number" },
        { key: "full_name", header: "Customer Name" },
        { key: "company_name", header: "Company Name" },
        { key: "mobile", header: "Mobile" },
        { key: "lead_source", header: "Source" },
        { key: "priority", header: "Priority" },
        { key: "assigned_employee", header: "Assigned Employee" },
        { key: "status", header: "Status" },
        { key: "verification_status", header: "Verification" },
      ]
    );
  }

  function handleDownloadTemplate() {
    const header = "Customer Name,Company Name,Email,Mobile,Alternate Mobile,Address,City,State,Product / Service,Priority,Notes";
    downloadBlob(new Blob([header], { type: "text/csv;charset=utf-8;" }), "lead-import-template.csv");
  }

  const columns = [
    ...COLUMNS,
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="cl-btn" onClick={() => navigate(leadViewPath(companyId, r.id))}>
            View
          </button>
          <button type="button" className="cl-btn" onClick={() => setReassignLeadId(r.id)}>
            Reassign
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="panel cl-panel">
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}

      <div className="dt-toolbar" style={{ paddingBottom: 0, flexWrap: "wrap" }}>
        {isSuperAdmin && (
          <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.length === 0 && <option value="">No companies found</option>}
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        )}

        <select className="dt-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Sources" : s}
            </option>
          ))}
        </select>

        <select className="dt-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p === "All" ? "All Priorities" : p}
            </option>
          ))}
        </select>

        <select className="dt-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="All">All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </select>

        <select className="dt-select" value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
          {VERIFICATION_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v === "All" ? "All Verification" : v}
            </option>
          ))}
        </select>

        <input type="date" className="dt-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Created from" />
        <input type="date" className="dt-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Created to" />

        <div className="dt-spacer" />

        <button type="button" className="cl-btn" onClick={handleDownloadTemplate} disabled={!companyId}>
          Download Template
        </button>

        <button type="button" className="cl-btn" onClick={() => setShowImport(true)} disabled={!companyId}>
          Import Leads
        </button>

        {selectedIds.size > 0 && (
          <button type="button" className="dash-primary-btn" onClick={() => setShowAssign(true)}>
            Assign Selected ({selectedIds.size})
          </button>
        )}
      </div>

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by lead number, name, company, mobile, email..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        sort={sort}
        onSortChange={setSort}
        sortOptions={[{ key: "created_at", label: "Date Added" }, { key: "full_name", label: "Name" }]}
        onExportCsv={handleExport}
        addLabel="Add New Lead"
        onAdd={companyId ? () => navigate(ROUTES.LEADS_ADD, { state: { companyId } }) : undefined}
      />

      <DataTable
        columns={columns}
        rows={leads}
        isLoading={false}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        emptyMessage={companyId ? "No leads found." : "Select a company to view its leads."}
      />

      {companyId && (
        <div className="cl-footer">
          <p>
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} lead{pagination.total === 1 ? "" : "s"}
          </p>
          <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
        </div>
      )}

      {showImport && (
        <ImportLeadsModal
          companyId={companyId}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setToast({ tone: "success", message: "Leads imported." });
          }}
        />
      )}

      {showAssign && (
        <AssignLeadsModal
          companyId={companyId}
          leadIds={[...selectedIds]}
          onClose={() => setShowAssign(false)}
          onAssigned={(assignedEmployee) => {
            setAllLeads((prev) => prev.map((l) => (selectedIds.has(l.id) ? { ...l, assigned_employee: assignedEmployee, status: l.status === "New" ? "Assigned" : l.status } : l)));
            setSelectedIds(new Set());
            setToast({ tone: "success", message: "Leads assigned." });
          }}
        />
      )}

      {reassignLeadId && (
        <AssignLeadsModal
          companyId={companyId}
          leadIds={[reassignLeadId]}
          onClose={() => setReassignLeadId(null)}
          onAssigned={(assignedEmployee) => {
            setAllLeads((prev) => prev.map((l) => (l.id === reassignLeadId ? { ...l, assigned_employee: assignedEmployee } : l)));
            setToast({ tone: "success", message: "Lead reassigned." });
          }}
        />
      )}
    </div>
  );
}
