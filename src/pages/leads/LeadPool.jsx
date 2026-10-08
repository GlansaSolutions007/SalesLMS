import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import ImportLeadsModal from "./components/ImportLeadsModal.jsx";
import AssignLeadsModal from "./components/AssignLeadsModal.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import useCompanyLeads from "./useCompanyLeads.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, leadViewPath } from "../../router/routePaths.js";
import { exportLeads, downloadLeadImportTemplate } from "../../services/api/leadsApi.js";

const STATUS_TONE = {
  new: "blue",
  assigned: "blue",
  contacted: "orange",
  "follow-up": "orange",
  interested: "purple",
  converted: "green",
  verified: "green",
  "closed lost": "red",
  "dnd/not lifted": "gray",
};
const STATUS_OPTIONS = ["All", "New", "Assigned", "Contacted", "Follow-up", "Interested", "Converted", "Verified", "Closed Lost", "DND/Not Lifted"];
const SOURCE_OPTIONS = ["All", "Manual Entry", "Excel Import", "CSV Import"];
const PRIORITY_OPTIONS = ["All", "Low", "Medium", "High"];
const VERIFICATION_OPTIONS = ["All", "Pending", "More Information Required", "Approved", "Rejected"];
const PRIORITY_TONE = { high: "red", medium: "orange", low: "gray" };

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
  const { options: companies, isLoading: companiesLoading } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const { options: employees } = useCompanyEmployeeOptions(companyId);

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

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

  const { leads, pagination, isLoading, error, refetch } = useCompanyLeads(companyId, {
    search: search.trim() || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    source: sourceFilter !== "All" ? sourceFilter : undefined,
    priority: priorityFilter !== "All" ? priorityFilter : undefined,
    employee_id: employeeFilter !== "All" ? employeeFilter : undefined,
    verification_status: verificationFilter !== "All" ? verificationFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort: sort.key,
    dir: sort.dir,
    page,
    per_page: 25,
  });

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

  async function handleExport() {
    try {
      const blob = await exportLeads(companyId, {
        status: statusFilter !== "All" ? statusFilter : undefined,
        source: sourceFilter !== "All" ? sourceFilter : undefined,
        priority: priorityFilter !== "All" ? priorityFilter : undefined,
        employee_id: employeeFilter !== "All" ? employeeFilter : undefined,
        verification_status: verificationFilter !== "All" ? verificationFilter : undefined,
      });
      downloadBlob(blob, "leads.xlsx");
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not export leads." });
    }
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadLeadImportTemplate(companyId);
      downloadBlob(blob, "lead-import-template.xlsx");
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not download template." });
    }
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
          <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={companiesLoading}>
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
        isLoading={isLoading || companiesLoading}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        emptyMessage={companyId ? "No leads found." : "Select a company to view its leads."}
      />

      {error && <p className="form-field-error">{error}</p>}

      {!isLoading && companyId && (
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
            refetch();
            setToast({ tone: "success", message: "Leads imported." });
          }}
        />
      )}

      {showAssign && (
        <AssignLeadsModal
          companyId={companyId}
          leadIds={[...selectedIds]}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            refetch();
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
          onAssigned={() => {
            refetch();
            setToast({ tone: "success", message: "Lead reassigned." });
          }}
        />
      )}
    </div>
  );
}
