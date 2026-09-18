import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import DateFilterField from "../../components/DateFilterField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_TONE = { pending: "orange", completed: "green", missed: "red", cancelled: "gray" };

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

const DUMMY_FOLLOWUPS = [
  { id: 1, lead: { lead_code: "LD-1001", full_name: "Karan Mehta" }, employee: { full_name: "Arjun Kumar" }, followup_type: "Call", followup_date: "2026-09-15T00:00:00.000000Z", followup_time: "11:00:00", next_followup_date: "2026-09-20T00:00:00.000000Z", status: "Pending", notes: "Discuss pricing." },
  { id: 2, lead: { lead_code: "LD-1002", full_name: "Sneha Rao" }, employee: { full_name: "Priya Singh" }, followup_type: "Email", followup_date: "2026-09-12T00:00:00.000000Z", followup_time: "15:30:00", next_followup_date: "2026-09-22T00:00:00.000000Z", status: "Completed", notes: "Sent proposal." },
  { id: 3, lead: { lead_code: "LD-1004", full_name: "Anita Desai" }, employee: { full_name: "Ravi Verma" }, followup_type: "Meeting", followup_date: "2026-09-10T00:00:00.000000Z", followup_time: "10:00:00", next_followup_date: "2026-09-18T00:00:00.000000Z", status: "Missed", notes: "" },
];

// Date-cast fields (followup_date, next_followup_date) come back as full ISO
// timestamps ("2026-08-11T00:00:00.000000Z") even though only the calendar
// date is meaningful — slicing avoids a timezone-shifted `new Date()` parse.
function formatDateOnly(value) {
  return value ? String(value).slice(0, 10) : null;
}

export default function FollowupsPage() {
  const { roleName } = useAuth();
  return roleName === "Employee" ? <MyFollowupsView /> : <AdminFollowupsView />;
}

function AdminFollowupsView() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const companies = DUMMY_COMPANIES;
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const employees = DUMMY_EMPLOYEES;

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");

  const followups = useMemo(() => {
    if (!companyId) return [];
    return DUMMY_FOLLOWUPS.filter((f) => {
      if (statusFilter !== "All" && f.status !== statusFilter) return false;
      if (employeeFilter !== "All" && f.employee?.full_name !== employees.find((e) => String(e.id) === String(employeeFilter))?.full_name) return false;
      return true;
    });
  }, [companyId, statusFilter, employeeFilter, employees]);

  const columns = [
    { key: "lead", header: "Lead", render: (r) => r.lead ? `${r.lead.lead_code || ""} — ${r.lead.full_name}` : "—" },
    { key: "employee", header: "Employee", render: (r) => r.employee?.full_name || "—" },
    { key: "followup_type", header: "Type" },
    { key: "followup_date", header: "Follow-up Date", render: (r) => `${formatDateOnly(r.followup_date)}${r.followup_time ? ` ${r.followup_time.slice(0, 5)}` : ""}` },
    { key: "next_followup_date", header: "Next Follow-up", render: (r) => formatDateOnly(r.next_followup_date) || "—" },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
    { key: "notes", header: "Notes", render: (r) => r.notes || "—" },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Follow-ups</h1>
            <Breadcrumb current="Follow-ups" />
          </div>
        </div>

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            {isSuperAdmin && (
              <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            )}
            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {["All", "Pending", "Completed", "Missed", "Cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Status" : s}
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
          </div>

          <DataTable columns={columns} rows={followups} isLoading={false} emptyMessage={companyId ? "No follow-ups found." : "Select a company."} />
        </div>
      </div>
    </>
  );
}

function MyFollowupsView() {
  const { toggleCollapsed } = useOutletContext();

  const [allFollowups, setAllFollowups] = useState(DUMMY_FOLLOWUPS.map(({ employee: _employee, ...rest }) => rest));
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const followups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allFollowups.filter((f) => {
      if (statusFilter !== "All" && f.status !== statusFilter) return false;
      if (term && !`${f.lead?.lead_code ?? ""} ${f.lead?.full_name ?? ""} ${f.notes ?? ""}`.toLowerCase().includes(term)) return false;
      if (dateFilter && formatDateOnly(f.next_followup_date) !== dateFilter) return false;
      return true;
    });
  }, [allFollowups, statusFilter, search, dateFilter]);

  function handleComplete(followup, newStatus) {
    setAllFollowups((prev) => prev.map((f) => (f.id === followup.id ? { ...f, status: newStatus } : f)));
  }

  const columns = [
    { key: "lead", header: "Lead", render: (r) => r.lead ? `${r.lead.lead_code || ""} — ${r.lead.full_name}` : "—" },
    { key: "followup_type", header: "Type" },
    { key: "followup_date", header: "Follow-up Date", render: (r) => `${formatDateOnly(r.followup_date)}${r.followup_time ? ` ${r.followup_time.slice(0, 5)}` : ""}` },
    { key: "next_followup_date", header: "Next Follow-up", render: (r) => formatDateOnly(r.next_followup_date) || "—" },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
    { key: "notes", header: "Notes", render: (r) => r.notes || "—" },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "Pending" ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="cl-btn" onClick={() => handleComplete(r, "Completed")}>
              Complete
            </button>
            <button type="button" className="cl-btn" onClick={() => handleComplete(r, "Missed")}>
              Missed
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Follow-ups</h1>
            <Breadcrumb current="Follow-ups" />
          </div>
        </div>

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            <div className="cl-search dt-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search by lead name, lead number, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {["All", "Pending", "Completed", "Missed", "Cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Status" : s}
                </option>
              ))}
            </select>

            <DateFilterField value={dateFilter} onChange={setDateFilter} title="Next Follow-up Date" />
          </div>

          <DataTable columns={columns} rows={followups} isLoading={false} emptyMessage="No follow-ups found." />
        </div>
      </div>
    </>
  );
}
