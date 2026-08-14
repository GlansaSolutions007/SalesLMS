import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
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
import { getAllSubscriptions, getSubscriptionPlans } from "../../services/subscriptionService.js";
import { companyViewPath } from "../../router/routePaths.js";
import { PAYMENT_TONE, SUBSCRIPTION_STATUS_TONE, formatDate, formatCurrency, formatDaysRemaining } from "../company/companyDisplay.jsx";
import "../company/CompanyList.css";

const STATUS_OPTIONS = ["All", "Upcoming", "Active", "Expired", "Cancelled", "Suspended"];
const BILLING_CYCLE_OPTIONS = ["All", "Monthly", "Quarterly", "Half Yearly", "Yearly"];
const PER_PAGE = 25;

export default function AllSubscriptions() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [billingCycleFilter, setBillingCycleFilter] = useState("All");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState([]);

  // Report filters (Plan / Billing Cycle / Date Range) — kept as a second
  // row local to this page rather than added to the shared DataToolbar,
  // which every other list page also uses and only supports one status
  // dropdown today.
  useEffect(() => {
    getSubscriptionPlans({ per_page: 100 }, token)
      .then((res) => setPlans(res.data?.data?.data ?? res.data?.data ?? []))
      .catch(() => setPlans([]));
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, per_page: PER_PAGE };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "All") params.status = statusFilter;
      if (planFilter !== "All") params.plan_id = planFilter;
      if (billingCycleFilter !== "All") params.billing_cycle = billingCycleFilter;
      if (expiryFrom) params.expiry_from = expiryFrom;
      if (expiryTo) params.expiry_to = expiryTo;
      const res = await getAllSubscriptions(params, token);
      const body = res.data?.data;
      setItems(Array.isArray(body?.data) ? body.data : []);
      setStats(body?.stats ?? {});
      setPagination(body?.pagination ?? { total: 0, current_page: 1, last_page: 1 });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter, billingCycleFilter, expiryFrom, expiryTo, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, planFilter, billingCycleFilter, expiryFrom, expiryTo]);

  const columns = [
    {
      key: "company",
      header: "Company",
      render: (r) => (
        <div>
          <p className="emp-name">{r.company?.company_name ?? "—"}</p>
          <p className="emp-code">{r.subscription_no}</p>
        </div>
      ),
    },
    { key: "plan", header: "Plan", render: (r) => r.plan?.plan_name ?? "—" },
    { key: "billing_cycle", header: "Billing Cycle", render: (r) => r.billing_cycle ?? "—" },
    { key: "end_date", header: "Expires", render: (r) => formatDate(r.end_date) },
    { key: "days_remaining", header: "Days Remaining", render: (r) => formatDaysRemaining(r) },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.total_amount ?? r.amount) },
    {
      key: "payment_status",
      header: "Payment",
      render: (r) => <Badge tone={PAYMENT_TONE[r.payment_status] ?? "gray"}>{r.payment_status}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={SUBSCRIPTION_STATUS_TONE[r.effective_status] ?? "gray"}>{r.effective_status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Link to={companyViewPath(r.company?.id)} className="dash-icon-btn" aria-label={`View ${r.company?.company_name}`} title="Manage in Company">
          <Icon name="eye" size={15} />
        </Link>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>All Subscriptions</h1>
            <Breadcrumb current="All Subscriptions" />
          </div>
        </div>

        <MastersTabs />

        <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
          <StatCard icon="check" label="Active" value={stats.total_active ?? 0} tone="green" />
          <StatCard icon="coin" label="Paid" value={stats.total_paid ?? 0} tone="blue" />
          <StatCard icon="clock" label="Payment Pending" value={stats.total_pending ?? 0} tone="orange" />
          <StatCard icon="warning" label="Expiring in 30 Days" value={stats.expiring_in_30_days ?? 0} tone="purple" />
        </div>

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by company or subscription number..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
          />

          {/* Subscription Report filters — Company/Status/search are above
              via DataToolbar; Plan/Billing Cycle/Expiry Date Range here. */}
          <div className="dt-toolbar" style={{ paddingTop: 0 }}>
            <select className="dt-select" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              <option value="All">All Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.plan_name}</option>
              ))}
            </select>
            <select className="dt-select" value={billingCycleFilter} onChange={(e) => setBillingCycleFilter(e.target.value)}>
              {BILLING_CYCLE_OPTIONS.map((c) => (
                <option key={c} value={c}>{c === "All" ? "All Billing Cycles" : c}</option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-muted)" }}>
              Expires
              <input type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} />
              to
              <input type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} />
            </label>
          </div>

          {error && <p className="cl-error">{error}</p>}

          <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No subscriptions found." />

          {!loading && (
            <div className="cl-footer">
              <p>Showing {items.length} of {pagination.total} subscription{pagination.total === 1 ? "" : "s"}</p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
