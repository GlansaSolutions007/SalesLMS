import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import AssignLeadsModal from "./components/AssignLeadsModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Company Admin / Super Admin only — assigns leads (uploaded via Excel/CSV
// or created manually without an owner) to individual employees, one at a
// time or in bulk. There is no team option: leads are assigned ONLY to
// individual employees.
const ASSIGNMENT_OPTIONS = [
  { value: "unassigned", label: "Unassigned Leads" },
  { value: "all", label: "All Leads" },
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
const PER_PAGE = 25;

// Design-only data — see LeadPool.jsx's note on this module's UI-only scope.
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
  { id: 1, lead_code: "LD-3001", full_name: "Vikram Joshi", company_name: "Joshi & Sons", mobile: "9876543212", lead_source: "CSV Import", priority: "Low", status: "Assigned", assigned_employee: null, created_at: "2026-09-09T10:00:00Z" },
  { id: 2, lead_code: "LD-3002", full_name: "Meera Iyer", company_name: "Iyer Consulting", mobile: "9876543215", lead_source: "Excel Import", priority: "Low", status: "New", assigned_employee: null, created_at: "2026-09-03T10:00:00Z" },
  { id: 3, lead_code: "LD-3003", full_name: "Karan Mehta", company_name: "Mehta Textiles", mobile: "9876543210", lead_source: "Manual Entry", priority: "High", status: "New", assigned_employee: { full_name: "Arjun Kumar" }, created_at: "2026-09-10T10:00:00Z" },
];

export default function AssignLeadsPage() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const companies = DUMMY_COMPANIES;
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const employees = DUMMY_EMPLOYEES;

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [allLeads, setAllLeads] = useState(DUMMY_LEADS);
  const [assignmentFilter, setAssignmentFilter] = useState("unassigned");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAssign, setShowAssign] = useState(false);
  const [reassignLeadId, setReassignLeadId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [companyId, assignmentFilter, sourceFilter]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter((l) => {
      if (assignmentFilter === "unassigned" && l.assigned_employee) return false;
      if (sourceFilter !== "All" && l.lead_source !== sourceFilter) return false;
      return true;
    });
  }, [allLeads, assignmentFilter, sourceFilter]);

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

  const columns = [
    { key: "lead_code", header: "Lead Number", render: (r) => r.lead_code || "—" },
    { key: "full_name", header: "Customer Name" },
    { key: "company_name", header: "Company Name", render: (r) => r.company_name || "—" },
    { key: "mobile", header: "Mobile" },
    { key: "lead_source", header: "Source" },
    { key: "priority", header: "Priority", render: (r) => r.priority || "Medium" },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
    { key: "assigned", header: "Currently Assigned", render: (r) => r.assigned_employee?.full_name || "Unassigned" },
    { key: "created_at", header: "Created Date", render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : "—") },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" className="cl-btn" onClick={() => setReassignLeadId(r.id)}>
          {r.assigned_employee ? "Reassign" : "Assign"}
        </button>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Assign Employee</h1>
            <Breadcrumb current="Assign Employee" />
          </div>
        </div>

        {companyId && employees.length === 0 && (
          <p className="form-field-error">No active employees found for this company — add employees before assigning leads.</p>
        )}

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

            <select className="dt-select" value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)}>
              {ASSIGNMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select className="dt-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              {["All", "Manual Entry", "Excel Import", "CSV Import"].map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Sources" : s}
                </option>
              ))}
            </select>

            <div className="dt-spacer" />

            {selectedIds.size > 0 && (
              <button type="button" className="dash-primary-btn" onClick={() => setShowAssign(true)}>
                Assign Selected ({selectedIds.size})
              </button>
            )}
          </div>

          <DataTable
            columns={columns}
            rows={leads}
            isLoading={false}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            emptyMessage={
              companyId
                ? assignmentFilter === "unassigned"
                  ? "No unassigned leads — everything has an owner."
                  : "No leads found."
                : "Select a company to view its leads."
            }
          />

          {companyId && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} lead{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {showAssign && (
        <AssignLeadsModal
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
          leadIds={[reassignLeadId]}
          onClose={() => setReassignLeadId(null)}
          onAssigned={(assignedEmployee) => {
            setAllLeads((prev) => prev.map((l) => (l.id === reassignLeadId ? { ...l, assigned_employee: assignedEmployee } : l)));
            setToast({ tone: "success", message: "Lead assigned." });
          }}
        />
      )}
    </>
  );
}
