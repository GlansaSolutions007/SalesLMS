import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import MastersTabs from "./MastersTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getExpiredSubscriptions } from "../../services/renewalRequestService.js";
import { companyViewPath, renewalRequestViewPath } from "../../router/routePaths.js";
import { PAYMENT_TONE, formatDate } from "../company/companyDisplay.jsx";
import "../company/CompanyList.css";

const PER_PAGE = 25;

const REQUEST_STATUS_TONE = { Pending: "orange", Approved: "blue", Completed: "green", Rejected: "red", Cancelled: "gray" };

// Spec #8: companies whose current/latest subscription has expired, so a
// Super Admin can find who needs to renew without scanning the full,
// unfiltered "All Subscriptions" report. Cross-references each row's
// latest renewal request status (backend-computed — see
// SubscriptionRenewalController::expiredSubscriptions()).
export default function ExpiredSubscriptions() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, per_page: PER_PAGE };
      if (search.trim()) params.search = search.trim();
      const res = await getExpiredSubscriptions(params, token);
      const body = res.data?.data;
      setItems(Array.isArray(body?.data) ? body.data : []);
      setPagination(body?.pagination ?? { total: 0, current_page: 1, last_page: 1 });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Could not load expired subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [page, search, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const columns = [
    {
      key: "company",
      header: "Company",
      render: (r) => (
        <div>
          <p className="emp-name">{r.company?.company_name ?? "—"}</p>
          <p className="emp-code">ID: {r.company?.id}</p>
        </div>
      ),
    },
    { key: "plan", header: "Plan", render: (r) => r.plan?.plan_name ?? "—" },
    { key: "subscription_no", header: "Subscription No.", render: (r) => r.subscription_no },
    { key: "start_date", header: "Start Date", render: (r) => formatDate(r.start_date) },
    { key: "end_date", header: "End Date", render: (r) => formatDate(r.end_date) },
    { key: "expired_date", header: "Expired Date", render: (r) => formatDate(r.end_date) },
    {
      key: "payment_status",
      header: "Payment Status",
      render: (r) => <Badge tone={PAYMENT_TONE[r.payment_status] ?? "gray"}>{r.payment_status}</Badge>,
    },
    { key: "status", header: "Subscription Status", render: () => <Badge tone="gray">Expired</Badge> },
    {
      key: "renewal_request_status",
      header: "Renewal Request",
      render: (r) =>
        r.renewal_request_status ? (
          <Badge tone={REQUEST_STATUS_TONE[r.renewal_request_status] ?? "gray"}>{r.renewal_request_status}</Badge>
        ) : (
          <span style={{ color: "var(--color-muted)" }}>None</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="dash-icon-btn"
            title="View Company"
            aria-label={`View ${r.company?.company_name}`}
            onClick={() => navigate(companyViewPath(r.company?.id))}
          >
            <Icon name="eye" size={15} />
          </button>
          {r.renewal_request_id ? (
            <button
              type="button"
              className="cl-btn"
              onClick={() => navigate(renewalRequestViewPath(r.renewal_request_id))}
            >
              Renew
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-muted)" }} title="Company hasn't submitted a renewal request yet">
              No request yet
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Expired Subscriptions</h1>
            <Breadcrumb current="Expired Subscriptions" />
          </div>
        </div>

        <MastersTabs />

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by company name or code..."
          />

          {error && <p className="cl-error">{error}</p>}

          <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No expired subscriptions." />

          {!loading && (
            <div className="cl-footer">
              <p>Showing {items.length} of {pagination.total} compan{pagination.total === 1 ? "y" : "ies"}</p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
