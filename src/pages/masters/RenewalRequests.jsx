import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import StatCard from "../../components/StatCard.jsx";
import MastersTabs from "./MastersTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAdminRenewalRequests } from "../../services/renewalRequestService.js";
import { renewalRequestViewPath } from "../../router/routePaths.js";
import { formatDate } from "../company/companyDisplay.jsx";
import "../company/CompanyList.css";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Completed", "Rejected", "Cancelled"];
const REQUEST_STATUS_TONE = { Pending: "orange", Approved: "blue", Completed: "green", Rejected: "red", Cancelled: "gray" };
const PER_PAGE = 25;

// Spec #9: Super Admin's queue of Company-Admin-submitted renewal requests —
// [View]/[Process] leads to RenewalRequestView.jsx, where payment is
// recorded and the renewal is actually activated.
export default function RenewalRequests() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, per_page: PER_PAGE };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "All") params.status = statusFilter;
      const res = await getAdminRenewalRequests(params, token);
      const body = res.data?.data;
      setItems(Array.isArray(body?.data) ? body.data : []);
      setStats(body?.stats ?? {});
      setPagination(body?.pagination ?? { total: 0, current_page: 1, last_page: 1 });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Could not load renewal requests.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const columns = [
    { key: "request_number", header: "Request Number" },
    {
      key: "company",
      header: "Company",
      render: (r) => r.company?.company_name ?? "—",
    },
    { key: "plan", header: "Current Plan", render: (r) => r.subscription?.plan?.plan_name ?? r.requested_plan?.plan_name ?? "—" },
    { key: "subscription_no", header: "Current Subscription", render: (r) => r.subscription?.subscription_no ?? "—" },
    { key: "current_end_date", header: "Current End Date", render: (r) => formatDate(r.subscription?.end_date) },
    { key: "requested_by", header: "Requested By", render: (r) => r.requested_by?.name ?? "—" },
    { key: "requested_at", header: "Request Date", render: (r) => formatDate(r.requested_at) },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={REQUEST_STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="cl-btn"
          onClick={() => navigate(renewalRequestViewPath(r.id))}
        >
          <Icon name="eye" size={14} />
          {r.status === "Pending" || r.status === "Approved" ? "Process" : "View"}
        </button>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Subscription Renewal Requests</h1>
            <Breadcrumb current="Renewal Requests" />
          </div>
        </div>

        <MastersTabs />

        <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
          <StatCard icon="clock" label="Pending" value={stats.total_pending ?? 0} tone="orange" />
          <StatCard icon="check" label="Approved" value={stats.total_approved ?? 0} tone="blue" />
          <StatCard icon="coin" label="Completed" value={stats.total_completed ?? 0} tone="green" />
          <StatCard icon="warning" label="Rejected" value={stats.total_rejected ?? 0} tone="red" />
        </div>

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by request number or company..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
          />

          {error && <p className="cl-error">{error}</p>}

          <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No renewal requests found." />

          {!loading && (
            <div className="cl-footer">
              <p>Showing {items.length} of {pagination.total} request{pagination.total === 1 ? "" : "s"}</p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
