import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import DateFilterField from "../../components/DateFilterField.jsx";
// This page hand-rolls its toolbar with the shared dt-toolbar/dt-select
// classes (same as FollowupsPage) rather than the <DataToolbar/> component,
// but still needs its stylesheet — without it .dt-toolbar isn't flexed and
// .dt-select renders as a bare unstyled <select>, which is what caused the
// misaligned, stacked-on-separate-lines filter row.
import "../../components/DataToolbar.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyLeads } from "../../services/api/leadsApi.js";
import { myLeadViewPath } from "../../router/routePaths.js";

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
const STATUSES = ["New", "Assigned", "Contacted", "Follow-up", "Interested", "Converted", "Closed Lost", "DND/Not Lifted"];

export default function MyAssignedLeads() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    getMyLeads(companyId, {
      status: statusFilter !== "All" ? statusFilter : undefined,
      search: search.trim() || undefined,
      follow_up_date: followUpDate || undefined,
      per_page: 50,
    })
      .then((res) => setLeads(res.items))
      .catch(() => setLeads([]))
      .finally(() => setIsLoading(false));
  }, [companyId, statusFilter, search, followUpDate]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "All" || followUpDate !== "";

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setFollowUpDate("");
  }

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
                placeholder="Search by name, company, mobile, lead no."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {["All", ...STATUSES].map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Status" : s}
                </option>
              ))}
            </select>

            <DateFilterField value={followUpDate} onChange={setFollowUpDate} title="Next Follow-up Date" />

            <div className="dt-spacer" />

            <button type="button" className="cl-btn" disabled={!hasActiveFilters} onClick={handleClearFilters}>
              <Icon name="refresh" size={15} />
              Clear Filters
            </button>
          </div>

          <DataTable columns={columns} rows={leads} isLoading={isLoading} emptyMessage="No leads assigned to you yet." />
        </div>
      </div>
    </>
  );
}
