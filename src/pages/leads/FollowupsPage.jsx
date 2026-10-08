import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import DateFilterField from "../../components/DateFilterField.jsx";
// Hand-rolled dt-toolbar/dt-select markup needs its own stylesheet import —
// see TargetList.jsx for why relying on another page to load it first breaks
// direct/refresh navigation.
import "../../components/DataToolbar.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyFollowups, getMyFollowups, updateMyFollowup } from "../../services/api/leadsApi.js";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";

const STATUS_TONE = { pending: "orange", completed: "green", missed: "red", cancelled: "gray" };

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
  const { options: companies } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const { options: employees } = useCompanyEmployeeOptions(companyId);

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [followups, setFollowups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setFollowups([]);
      return;
    }
    setIsLoading(true);
    getCompanyFollowups(companyId, {
      status: statusFilter !== "All" ? statusFilter : undefined,
      employee_id: employeeFilter !== "All" ? employeeFilter : undefined,
      per_page: 50,
    })
      .then((res) => setFollowups(res.items))
      .catch(() => setFollowups([]))
      .finally(() => setIsLoading(false));
  }, [companyId, statusFilter, employeeFilter]);

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

          <DataTable columns={columns} rows={followups} isLoading={isLoading} emptyMessage={companyId ? "No follow-ups found." : "Select a company."} />
        </div>
      </div>
    </>
  );
}

function MyFollowupsView() {
  const { toggleCollapsed } = useOutletContext();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [followups, setFollowups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    getMyFollowups(companyId, {
      status: statusFilter !== "All" ? statusFilter : undefined,
      search: search.trim() || undefined,
      date: dateFilter || undefined,
    })
      .then(setFollowups)
      .catch(() => setFollowups([]))
      .finally(() => setIsLoading(false));
  }, [companyId, statusFilter, search, dateFilter, refreshKey]);

  async function handleComplete(followup, newStatus) {
    try {
      await updateMyFollowup(companyId, followup.id, { status: newStatus });
      setRefreshKey((k) => k + 1);
    } catch {
      // surfaced implicitly via the row staying unchanged; keep this view simple.
    }
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

          <DataTable columns={columns} rows={followups} isLoading={isLoading} emptyMessage="No follow-ups found." />
        </div>
      </div>
    </>
  );
}
