import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import DateFilterField from "../../components/DateFilterField.jsx";
import { myLeadViewPath } from "../../router/routePaths.js";

// Design-only data — see LeadPool.jsx's note on this module's UI-only scope.
const DUMMY_MY_LEADS = [
  { id: 1, lead_code: "LD-2001", full_name: "Karan Mehta", company_name: "Mehta Textiles", mobile: "9876543210", lead_source: "Manual Entry", priority: "High", next_follow_up_date: "2026-09-20", next_follow_up_time: "11:00:00", status: "New" },
  { id: 2, lead_code: "LD-2002", full_name: "Sneha Rao", company_name: "Rao Enterprises", mobile: "9876543211", lead_source: "Excel Import", priority: "Medium", next_follow_up_date: "2026-09-22", next_follow_up_time: "15:30:00", status: "Contacted" },
  { id: 3, lead_code: "LD-2003", full_name: "Rahul Nair", company_name: "Nair Logistics", mobile: "9876543214", lead_source: "Manual Entry", priority: "Medium", next_follow_up_date: null, next_follow_up_time: null, status: "Converted" },
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
const STATUSES = ["New", "Assigned", "Contacted", "Follow-up", "Interested", "Converted", "Closed Lost"];

export default function MyAssignedLeads() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const leads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return DUMMY_MY_LEADS.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (term && !`${l.lead_code} ${l.full_name} ${l.company_name} ${l.mobile}`.toLowerCase().includes(term)) return false;
      if (followUpDate && l.next_follow_up_date !== followUpDate) return false;
      return true;
    });
  }, [statusFilter, search, followUpDate]);

  const columns = [
    { key: "lead_code", header: "Lead Number", render: (r) => r.lead_code || "—" },
    { key: "full_name", header: "Customer Name" },
    { key: "company_name", header: "Company Name", render: (r) => r.company_name || "—" },
    { key: "mobile", header: "Mobile" },
    { key: "lead_source", header: "Source" },
    { key: "priority", header: "Priority", render: (r) => r.priority || "Medium" },
    {
      key: "next_follow_up_date",
      header: "Next Follow-up",
      render: (r) =>
        r.next_follow_up_date
          ? `${String(r.next_follow_up_date).slice(0, 10)}${r.next_follow_up_time ? ` ${r.next_follow_up_time.slice(0, 5)}` : ""}`
          : "—",
    },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" className="cl-btn" onClick={() => navigate(myLeadViewPath(r.id))}>
          Track Lead
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
            <h1>My Leads</h1>
            <Breadcrumb current="My Leads" />
          </div>
        </div>

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            <div className="cl-search dt-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search by name, company, mobile, lead number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {["All", ...STATUSES].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <DateFilterField value={followUpDate} onChange={setFollowUpDate} title="Next Follow-up Date" />
          </div>

          <DataTable columns={columns} rows={leads} isLoading={false} emptyMessage="No leads assigned to you yet." />
        </div>
      </div>
    </>
  );
}
