import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Avatar from "../../components/Avatar.jsx";
import StatCard from "../../components/StatCard.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import DataTable from "../../components/DataTable.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyById, getCompanyProfile, ApiError } from "../../services/api/companyApi.js";
import {
  renewSubscription,
  extendSubscription,
  updateSubscriptionPaymentStatus,
  cancelSubscription,
  getCompanySubscriptions,
  getSubscriptionPlans,
} from "../../services/subscriptionService.js";
import {
  getRenewalRequests,
  createRenewalRequest,
  cancelRenewalRequest,
} from "../../services/renewalRequestService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES, companyEditPath, renewalRequestViewPath } from "../../router/routePaths.js";
import BuySubscriptionModal from "../../components/payment/BuySubscriptionModal.jsx";
import SeatIncreaseModal from "../../components/payment/SeatIncreaseModal.jsx";
import PaymentHistoryModal from "../../components/payment/PaymentHistoryModal.jsx";
import InvoicesModal from "../../components/payment/InvoicesModal.jsx";
import {
  PAYMENT_TONE,
  SUBSCRIPTION_STATUS_TONE,
  formatDate,
  formatStorage,
  formatCurrency,
  formatWeeklyOff,
  formatDaysRemaining,
  DetailField,
} from "./companyDisplay.jsx";
import "./CompanyView.css";

const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Expired"];
const REQUEST_STATUS_TONE = { Pending: "orange", Approved: "blue", Completed: "green", Rejected: "red", Cancelled: "gray" };

function RENEWAL_REQUEST_COLUMNS(onProcess, onCancel) {
  return [
    { key: "request_number", header: "Request Number" },
    { key: "requested_at", header: "Requested On", render: (r) => formatDate(r.requested_at) },
    { key: "current_end_date", header: "Previous End Date", render: (r) => formatDate(r.subscription?.end_date) },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={REQUEST_STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 6 }}>
          {onProcess && (
            <button type="button" className="dash-icon-btn" title="Process" aria-label={`Process ${r.request_number}`} onClick={() => onProcess(r)}>
              <Icon name="eye" size={15} />
            </button>
          )}
          {onCancel && r.status === "Pending" && (
            <button type="button" className="dash-icon-btn" title="Cancel request" aria-label={`Cancel ${r.request_number}`} onClick={() => onCancel(r)}>
              <Icon name="close" size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];
}

// Subscription History table columns — Subscription No / Plan / Billing
// Cycle / Employee Count / Price Per Employee / Total Amount / Start /
// End / Payment Status / Subscription Status / Created By / Created Date /
// View, exactly as requested.
function HISTORY_COLUMNS(onView) {
  return [
    { key: "subscription_no", header: "Subscription No." },
    { key: "plan", header: "Plan", render: (r) => r.plan?.plan_name ?? "—" },
    { key: "billing_cycle", header: "Billing Cycle" },
    { key: "employee_count", header: "Employees", render: (r) => <span className="cl-numeric">{r.employee_count ?? "—"}</span> },
    { key: "price_per_employee", header: "Price/Employee", render: (r) => formatCurrency(r.price_per_employee) },
    { key: "total_amount", header: "Total Amount", render: (r) => formatCurrency(r.total_amount) },
    { key: "start_date", header: "Start Date", render: (r) => formatDate(r.start_date) },
    { key: "end_date", header: "End Date", render: (r) => formatDate(r.end_date) },
    {
      key: "payment_status",
      header: "Payment",
      render: (r) => <Badge tone={PAYMENT_TONE[r.payment_status] ?? "gray"}>{r.payment_status}</Badge>,
    },
    {
      key: "effective_status",
      header: "Status",
      render: (r) => <Badge tone={SUBSCRIPTION_STATUS_TONE[r.effective_status] ?? "gray"}>{r.effective_status}</Badge>,
    },
    { key: "created_by", header: "Created By", render: (r) => r.created_by?.name ?? "—" },
    { key: "created_at", header: "Created Date", render: (r) => formatDate(r.created_at) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" className="dash-icon-btn" aria-label={`View ${r.subscription_no}`} onClick={() => onView(r)}>
          <Icon name="eye" size={15} />
        </button>
      ),
    },
  ];
}

export default function CompanyView() {
  const { id: routeId } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token, user, roleName } = useAuth();

  // No :id in the URL means this is a Company Admin viewing their own
  // company (/company/profile) rather than Super Admin browsing a company
  // from the companies list (/company/view/:id) — resolve the id from the
  // logged-in user and hit the endpoint a Company Admin is actually
  // authorized to call.
  const isOwnProfile = !routeId;
  const id = routeId ?? user?.company?.id;

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [company, setCompany] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const isSuperAdmin = roleName === "Super Admin";
  const isCompanyAdminRole = roleName === "Company Admin";
  // Razorpay self-service (Subscribe/Increase Seats/Payment History/
  // Invoices) is reachable by a Company Admin managing their own company,
  // or a Super Admin managing any company — unlike the admin-manual
  // Renew/Upgrade/Extend/Payment Status/Cancel actions below, which stay
  // Super-Admin-only exactly as before (their backend routes never changed).
  const canManagePayments = isSuperAdmin || isOwnProfile;
  const [buySubOpen, setBuySubOpen] = useState(false);
  const [seatIncreaseOpen, setSeatIncreaseOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [invoicesOpen, setInvoicesOpen] = useState(false);

  const [renewOpen, setRenewOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentValue, setPaymentValue] = useState("Pending");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(false);
  const [subToast, setSubToast] = useState(null);

  // Upgrade — reuses renewSubscription() with a plan_id; the backend
  // classifies Upgrade vs Downgrade automatically (see subscription.todo.md).
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePlanId, setUpgradePlanId] = useState("");
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Extend
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState(3);

  // View History
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyDetail, setHistoryDetail] = useState(null);

  // Renewal Requests — visible on a Company Admin's own profile (they can
  // submit/cancel) and to a Super Admin browsing any company (read-only
  // list here; processing a request happens on the dedicated Masters >
  // Renewal Requests > Process page, not inline in this panel).
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [renewalRequestsLoading, setRenewalRequestsLoading] = useState(false);
  const [requestRenewalOpen, setRequestRenewalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [cancelRequestTarget, setCancelRequestTarget] = useState(null);

  function loadRenewalRequests() {
    if (!id) return;
    setRenewalRequestsLoading(true);
    getRenewalRequests(id, token)
      .then((res) => setRenewalRequests(res.data?.data ?? []))
      .catch(() => setRenewalRequests([]))
      .finally(() => setRenewalRequestsLoading(false));
  }

  async function handleSubmitRenewalRequest() {
    setSubActionLoading(true);
    try {
      await createRenewalRequest(id, { message: requestMessage.trim() || undefined }, token);
      setRequestRenewalOpen(false);
      setRequestMessage("");
      loadRenewalRequests();
      setSubToast({ tone: "success", message: "Renewal request submitted successfully." });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not submit renewal request." });
    } finally {
      setSubActionLoading(false);
    }
  }

  async function handleCancelRenewalRequest() {
    if (!cancelRequestTarget) return;
    setSubActionLoading(true);
    try {
      await cancelRenewalRequest(id, cancelRequestTarget.id, token);
      setCancelRequestTarget(null);
      loadRenewalRequests();
      setSubToast({ tone: "success", message: "Renewal request cancelled." });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not cancel renewal request." });
    } finally {
      setSubActionLoading(false);
    }
  }

  function refreshCompany() {
    setRetryKey((k) => k + 1);
  }

  async function handleRenew() {
    setSubActionLoading(true);
    try {
      await renewSubscription(id, company.active_subscription.id, {}, token);
      setRenewOpen(false);
      refreshCompany();
      setSubToast({ tone: "success", message: "Subscription renewed." });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not renew subscription." });
    } finally {
      setSubActionLoading(false);
    }
  }

  async function openUpgrade() {
    setUpgradePlanId("");
    setUpgradeOpen(true);
    setPlansLoading(true);
    try {
      const res = await getSubscriptionPlans({ status: "Active", per_page: 100 }, token);
      const list = res.data?.data?.data ?? res.data?.data ?? [];
      // The company's current plan isn't a valid "upgrade" target.
      setPlans(list.filter((p) => p.id !== company.active_subscription?.plan?.id));
    } catch {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }

  async function handleUpgrade() {
    if (!upgradePlanId) return;
    setSubActionLoading(true);
    try {
      await renewSubscription(id, company.active_subscription.id, { plan_id: upgradePlanId }, token);
      setUpgradeOpen(false);
      refreshCompany();
      setSubToast({ tone: "success", message: "Subscription plan changed." });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not change plan." });
    } finally {
      setSubActionLoading(false);
    }
  }

  async function handleExtend() {
    const months = Number(extendMonths);
    if (!months || months < 1) return;
    setSubActionLoading(true);
    try {
      await extendSubscription(id, company.active_subscription.id, { extension_months: months }, token);
      setExtendOpen(false);
      refreshCompany();
      setSubToast({ tone: "success", message: `Subscription extended by ${months} month(s).` });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not extend subscription." });
    } finally {
      setSubActionLoading(false);
    }
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await getCompanySubscriptions(id, token);
      setHistoryItems(res.data?.data ?? []);
    } catch (err) {
      setHistoryError(err?.response?.data?.message ?? "Could not load subscription history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handlePaymentStatus() {
    setSubActionLoading(true);
    try {
      await updateSubscriptionPaymentStatus(id, company.active_subscription.id, paymentValue, token);
      setPaymentOpen(false);
      refreshCompany();
      setSubToast({ tone: "success", message: "Payment status updated." });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not update payment status." });
    } finally {
      setSubActionLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setSubActionLoading(true);
    try {
      await cancelSubscription(id, company.active_subscription.id, "", token);
      setCancelOpen(false);
      refreshCompany();
      setSubToast({ tone: "success", message: "Subscription cancelled." });
    } catch (err) {
      setSubToast({ tone: "error", message: err?.response?.data?.message ?? "Could not cancel subscription." });
    } finally {
      setSubActionLoading(false);
    }
  }

  // Seat usage (Employees Used/Available). `company.active_subscription`
  // comes straight from CompanyController's plain relation load, which —
  // unlike SubscriptionController's index/show/renew endpoints — doesn't
  // run formatSubscription() and so has no `usage` field. Rather than
  // duplicating that Active-employee-count query on the frontend (and
  // risking it drifting from the count checkEmployeeLimit() actually
  // enforces), this re-fetches through the same formatted endpoint the
  // History modal already uses and picks out the matching subscription.
  const [subscriptionUsage, setSubscriptionUsage] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setStatus("loading");

    const fetchCompany = isOwnProfile ? getCompanyProfile : getCompanyById;

    fetchCompany(id, token)
      .then((data) => {
        if (cancelled) return;
        setCompany(data);
        setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("notFound");
        } else {
          setErrorMessage(error.message ?? "Could not load this company.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, token, retryKey, isOwnProfile]);

  useEffect(() => {
    const activeId = company?.active_subscription?.id;
    if (!id || !activeId) {
      setSubscriptionUsage(null);
      return undefined;
    }
    let cancelled = false;
    getCompanySubscriptions(id, token)
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data ?? [];
        const match = list.find((s) => s.id === activeId);
        setSubscriptionUsage(match?.usage ?? null);
      })
      .catch(() => !cancelled && setSubscriptionUsage(null));
    return () => {
      cancelled = true;
    };
  }, [id, token, company?.active_subscription?.id]);

  useEffect(loadRenewalRequests, [id, token, retryKey]);

  const backTarget = isOwnProfile ? ROUTES.DASHBOARD : ROUTES.COMPANY_COMPANIES;
  const editTarget = isOwnProfile ? ROUTES.COMPANY_PROFILE_EDIT : companyEditPath(id);

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>{isOwnProfile ? "Company Profile" : "Company Details"}</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              {!isOwnProfile && (
                <>
                  <Icon name="chevronRight" size={13} />
                  <span>Companies</span>
                </>
              )}
              <Icon name="chevronRight" size={13} />
              <span className="is-current">{isOwnProfile ? "Company Profile" : "View Company"}</span>
            </p>
          </div>

          <div className="cv-header-actions">
            {!isOwnProfile && (
              <button type="button" className="cl-btn" onClick={() => navigate(backTarget)}>
                <Icon name="back" size={15} />
                Back
              </button>
            )}
            <button type="button" className="dash-primary-btn" onClick={() => navigate(editTarget)}>
              <Icon name="edit" size={15} />
              {isOwnProfile ? "Edit Profile" : "Edit Company"}
            </button>
          </div>
        </div>

        {status === "loading" && <CompanyViewSkeleton />}

        {status === "notFound" && (
          <div className="panel cv-state-panel">
            <Icon name="building" size={28} />
            <h3>Company not found</h3>
            <p>We couldn't find a company with this ID. It may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(backTarget)}>
              {isOwnProfile ? "Back to Dashboard" : "Back to Companies"}
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this company</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && company && (
          <>
            <div className="panel cv-profile-card">
              <Avatar src={resolveApiAssetUrl(company.logo)} name={company.company_name} size={72} shape="square" />
              <div className="cv-profile-info">
                <div className="cv-profile-title">
                  <h2>{company.company_name}</h2>
                  <Badge tone={company.status === "Active" ? "green" : "gray"}>{company.status ?? "—"}</Badge>
                </div>
                <p className="cv-profile-code">{company.company_code}</p>
                <div className="cv-profile-meta">
                  <span>
                    <Icon name="building" size={14} />
                    {company.industry_type || "—"}
                  </span>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer">
                      <Icon name="globe" size={14} />
                      {company.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="cv-stats-grid">
              <StatCard icon="users" label="Employees" value={company.employees_count ?? 0} tone="blue" />
              <StatCard icon="building" label="Branches" value={company.branches_count ?? 0} tone="purple" />
              <StatCard icon="gridView" label="Departments" value={company.departments_count ?? 0} tone="green" />
              <StatCard icon="clipboard" label="Designations" value={company.designations_count ?? 0} tone="orange" />
            </div>

            <div className="cv-columns">
              <div className="cv-main-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Company Information</h3>
                  <div className="detail-grid">
                    <DetailField label="Legal Name">{company.legal_name}</DetailField>
                    <DetailField label="Registration Number">{company.registration_number}</DetailField>
                    <DetailField label="GST Number">{company.gst_number}</DetailField>
                    <DetailField label="PAN Number">{company.pan_number}</DetailField>
                    <DetailField label="Email">{company.email}</DetailField>
                    <DetailField label="Mobile">{company.mobile}</DetailField>
                    <DetailField label="Phone">{company.phone}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Address</h3>
                  <div className="detail-grid">
                    <DetailField label="Address Line 1">{company.address_line1}</DetailField>
                    <DetailField label="Address Line 2">{company.address_line2}</DetailField>
                    <DetailField label="City">{company.city}</DetailField>
                    <DetailField label="State">{company.state}</DetailField>
                    <DetailField label="Country">{company.country}</DetailField>
                    <DetailField label="Pincode">{company.pincode}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <h3 className="cv-section-title" style={{ marginBottom: 0 }}>Current Subscription</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className="cl-btn" onClick={openHistory}>
                        View History
                      </button>
                      {canManagePayments && (
                        <>
                          <button type="button" className="cl-btn" onClick={() => setPaymentHistoryOpen(true)}>
                            Payment History
                          </button>
                          <button type="button" className="cl-btn" onClick={() => setInvoicesOpen(true)}>
                            Invoices
                          </button>
                        </>
                      )}
                      {isSuperAdmin && company.active_subscription && (
                        <>
                          <button
                            type="button"
                            className="cl-btn"
                            onClick={() => {
                              setPaymentValue(company.active_subscription.payment_status ?? "Pending");
                              setPaymentOpen(true);
                            }}
                          >
                            Payment Status
                          </button>
                          <button type="button" className="cl-btn" onClick={() => setRenewOpen(true)}>
                            Renew
                          </button>
                          <button type="button" className="cl-btn" onClick={openUpgrade}>
                            Upgrade
                          </button>
                          <button type="button" className="cl-btn" onClick={() => setExtendOpen(true)}>
                            Extend
                          </button>
                          {company.active_subscription.effective_status === "Active" && (
                            <button type="button" className="cl-btn tp-deactivate-btn" onClick={() => setCancelOpen(true)}>
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                      {canManagePayments && company.active_subscription && company.active_subscription.employee_limit !== null && (
                        <button type="button" className="cl-btn" onClick={() => setSeatIncreaseOpen(true)}>
                          Increase Employee Seats
                        </button>
                      )}
                      {canManagePayments && !company.active_subscription && (
                        <button type="button" className="dash-primary-btn cl-add-btn" onClick={() => setBuySubOpen(true)}>
                          Subscribe Now
                        </button>
                      )}
                    </div>
                  </div>
                  {company.active_subscription ? (
                    <div className="detail-grid">
                      <DetailField label="Plan">{company.active_subscription.plan?.plan_name}</DetailField>
                      <DetailField label="Subscription Number">{company.active_subscription.subscription_no}</DetailField>
                      <DetailField label="Billing Cycle">{company.active_subscription.billing_cycle}</DetailField>
                      <DetailField label="Employee Limit">{company.active_subscription.employee_limit ?? "Unlimited"}</DetailField>
                      <DetailField label="Employees Used">{subscriptionUsage?.employees_used ?? "—"}</DetailField>
                      <DetailField label="Employees Available">
                        {company.active_subscription.employee_limit === null ? "Unlimited" : subscriptionUsage?.employees_left ?? "—"}
                      </DetailField>
                      <DetailField label="Price Per Employee">{formatCurrency(company.active_subscription.price_per_employee)}</DetailField>
                      <DetailField label="Start Date">{formatDate(company.active_subscription.start_date)}</DetailField>
                      <DetailField label="End Date">{formatDate(company.active_subscription.end_date)}</DetailField>
                      <DetailField label="Days Remaining">{formatDaysRemaining(company.active_subscription)}</DetailField>
                      <DetailField label="Trainer Limit">{company.active_subscription.trainer_limit}</DetailField>
                      <DetailField label="Storage Limit">{formatStorage(company.active_subscription.storage_limit)}</DetailField>
                      <DetailField label="Total Amount">{formatCurrency(company.active_subscription.total_amount)}</DetailField>
                      <DetailField label="Payment Status">
                        <Badge tone={PAYMENT_TONE[company.active_subscription.payment_status] ?? "gray"}>
                          {company.active_subscription.payment_status ?? "—"}
                        </Badge>
                      </DetailField>
                      <DetailField label="Subscription Status">
                        <Badge tone={SUBSCRIPTION_STATUS_TONE[company.active_subscription.effective_status] ?? "gray"}>
                          {company.active_subscription.effective_status ?? "—"}
                        </Badge>
                      </DetailField>
                    </div>
                  ) : (
                    <div className="cv-empty-inline">
                      <Icon name="coin" size={22} />
                      <p>No Subscription Available</p>
                    </div>
                  )}
                </section>

                <section className="panel cv-section">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <h3 className="cv-section-title" style={{ marginBottom: 0 }}>Subscription Renewal Requests</h3>
                    {isOwnProfile && isCompanyAdminRole && (!company.active_subscription || company.active_subscription.effective_status === "Expired") && (
                      <button
                        type="button"
                        className="dash-primary-btn cl-add-btn"
                        disabled={renewalRequests.some((r) => r.status === "Pending")}
                        onClick={() => setRequestRenewalOpen(true)}
                      >
                        Request Subscription Renewal
                      </button>
                    )}
                  </div>
                  {renewalRequests.some((r) => r.status === "Pending") && (
                    <p className="cv-inline-hint">Your subscription renewal request is already pending with the administrator.</p>
                  )}
                  <DataTable
                    columns={RENEWAL_REQUEST_COLUMNS(
                      isSuperAdmin ? (r) => navigate(renewalRequestViewPath(r.id)) : null,
                      isOwnProfile ? (r) => setCancelRequestTarget(r) : null
                    )}
                    rows={renewalRequests}
                    isLoading={renewalRequestsLoading}
                    emptyMessage="No renewal requests yet."
                  />
                </section>
              </div>

              <div className="cv-side-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Company Settings</h3>
                  <div className="detail-grid cv-settings-grid">
                    <DetailField label="Timezone">{company.settings?.timezone}</DetailField>
                    <DetailField label="Language">{company.settings?.language?.toUpperCase()}</DetailField>
                    <DetailField label="Currency">{company.settings?.currency}</DetailField>
                    <DetailField label="Date Format">{company.settings?.date_format}</DetailField>
                    <DetailField label="Office Start Time">{company.settings?.office_start_time}</DetailField>
                    <DetailField label="Office End Time">{company.settings?.office_end_time}</DetailField>
                    <DetailField label="Weekly Off">{formatWeeklyOff(company.settings?.weekly_off_days)}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Created Information</h3>
                  <div className="detail-grid cv-settings-grid">
                    <DetailField label="Created By">{company.created_by?.name}</DetailField>
                    <DetailField label="Created Email">{company.created_by?.email}</DetailField>
                    <DetailField label="Created Date">{formatDate(company.created_at)}</DetailField>
                    <DetailField label="Last Updated">{formatDate(company.updated_at)}</DetailField>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      {renewOpen && company?.active_subscription && (
        <ConfirmDialog
          title="Renew Subscription"
          message={`Renew "${company.active_subscription.plan?.plan_name ?? "this plan"}" for another ${company.active_subscription.plan?.billing_cycle ?? "billing"} cycle, starting from the current end date?`}
          confirmLabel={subActionLoading ? "Renewing…" : "Renew"}
          onCancel={() => setRenewOpen(false)}
          onConfirm={handleRenew}
        />
      )}

      {paymentOpen && company?.active_subscription && (
        <Modal
          title="Update Payment Status"
          onClose={() => setPaymentOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setPaymentOpen(false)}>Cancel</button>
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={subActionLoading} onClick={handlePaymentStatus}>
                {subActionLoading ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <FormField label="Payment Status">
            <select value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)}>
              {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </Modal>
      )}

      {cancelOpen && company?.active_subscription && (
        <ConfirmDialog
          title="Cancel Subscription"
          message="This will cancel the company's active subscription. This cannot be undone from here — a new subscription would need to be created."
          confirmLabel={subActionLoading ? "Cancelling…" : "Cancel Subscription"}
          onCancel={() => setCancelOpen(false)}
          onConfirm={handleCancelSubscription}
        />
      )}

      {upgradeOpen && company?.active_subscription && (
        <Modal
          title="Upgrade / Change Plan"
          onClose={() => setUpgradeOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setUpgradeOpen(false)}>Cancel</button>
              <button
                type="button"
                className="dash-primary-btn cl-add-btn"
                disabled={subActionLoading || !upgradePlanId}
                onClick={handleUpgrade}
              >
                {subActionLoading ? "Saving…" : "Change Plan"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0, color: "var(--color-muted)", fontSize: 13 }}>
            Creates a new subscription record on the selected plan, effective from the current subscription&apos;s end
            date. The current subscription is kept, unchanged, in history.
          </p>
          <FormField label="New Plan">
            {plansLoading ? (
              <p>Loading plans…</p>
            ) : (
              <select value={upgradePlanId} onChange={(e) => setUpgradePlanId(e.target.value)}>
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name} — {formatCurrency(p.price_per_employee)}/employee/{p.billing_cycle}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </Modal>
      )}

      {extendOpen && company?.active_subscription && (
        <Modal
          title="Extend Subscription"
          onClose={() => setExtendOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setExtendOpen(false)}>Cancel</button>
              <button
                type="button"
                className="dash-primary-btn cl-add-btn"
                disabled={subActionLoading || !extendMonths}
                onClick={handleExtend}
              >
                {subActionLoading ? "Saving…" : "Extend"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0, color: "var(--color-muted)", fontSize: 13 }}>
            Current end date: <strong>{formatDate(company.active_subscription.end_date)}</strong>. Extending creates a
            new subscription record for just the added period, on the same plan.
          </p>
          <FormField label="Extension (months)">
            <input
              type="number"
              min={1}
              max={36}
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
            />
          </FormField>
        </Modal>
      )}

      {historyOpen && (
        <Modal title="Subscription History" onClose={() => setHistoryOpen(false)} size="lg">
          {historyError && <p className="cl-error">{historyError}</p>}
          <DataTable
            columns={HISTORY_COLUMNS(setHistoryDetail)}
            rows={historyItems}
            isLoading={historyLoading}
            emptyMessage="No subscription history yet."
          />
        </Modal>
      )}

      {historyDetail && (
        <Modal title={`Subscription ${historyDetail.subscription_no}`} onClose={() => setHistoryDetail(null)}>
          <div className="detail-grid">
            <DetailField label="Plan">{historyDetail.plan?.plan_name}</DetailField>
            <DetailField label="Billing Cycle">{historyDetail.billing_cycle}</DetailField>
            <DetailField label="Employee Count">{historyDetail.employee_count}</DetailField>
            <DetailField label="Price Per Employee">{formatCurrency(historyDetail.price_per_employee)}</DetailField>
            <DetailField label="Total Amount">{formatCurrency(historyDetail.total_amount)}</DetailField>
            <DetailField label="Start Date">{formatDate(historyDetail.start_date)}</DetailField>
            <DetailField label="End Date">{formatDate(historyDetail.end_date)}</DetailField>
            <DetailField label="Renewal Type">{historyDetail.renewal_type}</DetailField>
            <DetailField label="Payment Status">
              <Badge tone={PAYMENT_TONE[historyDetail.payment_status] ?? "gray"}>{historyDetail.payment_status}</Badge>
            </DetailField>
            <DetailField label="Subscription Status">
              <Badge tone={SUBSCRIPTION_STATUS_TONE[historyDetail.effective_status] ?? "gray"}>{historyDetail.effective_status}</Badge>
            </DetailField>
            <DetailField label="Created By">{historyDetail.created_by?.name}</DetailField>
            <DetailField label="Created Date">{formatDate(historyDetail.created_at)}</DetailField>
          </div>
        </Modal>
      )}

      {requestRenewalOpen && (
        <Modal
          title="Request Subscription Renewal"
          onClose={() => setRequestRenewalOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setRequestRenewalOpen(false)}>Cancel</button>
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={subActionLoading} onClick={handleSubmitRenewalRequest}>
                {subActionLoading ? "Submitting…" : "Submit Renewal Request"}
              </button>
            </>
          }
        >
          <div className="detail-grid">
            <DetailField label="Company Name">{company.company_name}</DetailField>
            <DetailField label="Current Plan">{company.active_subscription?.plan?.plan_name}</DetailField>
            <DetailField label="Previous Subscription End Date">{formatDate(company.active_subscription?.end_date)}</DetailField>
          </div>
          <FormField label="Optional Message">
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Anything the administrator should know…"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />
          </FormField>
        </Modal>
      )}

      {cancelRequestTarget && (
        <ConfirmDialog
          title="Cancel Renewal Request"
          message={`Cancel renewal request ${cancelRequestTarget.request_number}? You'll be able to submit a new one afterwards.`}
          confirmLabel={subActionLoading ? "Cancelling…" : "Cancel Request"}
          onCancel={() => setCancelRequestTarget(null)}
          onConfirm={handleCancelRenewalRequest}
        />
      )}

      {buySubOpen && (
        <BuySubscriptionModal
          company={company}
          token={token}
          user={user}
          onClose={() => setBuySubOpen(false)}
          onSuccess={(message) => {
            setBuySubOpen(false);
            refreshCompany();
            setSubToast({ tone: "success", message });
          }}
        />
      )}

      {seatIncreaseOpen && company?.active_subscription && (
        <SeatIncreaseModal
          company={company}
          subscription={company.active_subscription}
          usage={subscriptionUsage}
          token={token}
          user={user}
          onClose={() => setSeatIncreaseOpen(false)}
          onSuccess={(message) => {
            setSeatIncreaseOpen(false);
            refreshCompany();
            setSubToast({ tone: "success", message });
          }}
        />
      )}

      {paymentHistoryOpen && (
        <PaymentHistoryModal
          company={company}
          token={token}
          user={user}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setPaymentHistoryOpen(false)}
          onChanged={refreshCompany}
        />
      )}

      {invoicesOpen && <InvoicesModal company={company} token={token} onClose={() => setInvoicesOpen(false)} />}

      <Toast tone={subToast?.tone} message={subToast?.message} onDismiss={() => setSubToast(null)} />
    </>
  );
}

function CompanyViewSkeleton() {
  return (
    <>
      <div className="panel cv-profile-card">
        <Skeleton width={72} height={72} radius={14} />
        <div className="cv-profile-info">
          <Skeleton width="40%" height={22} />
          <Skeleton width="20%" height={14} className="cv-skeleton-gap" />
          <Skeleton width="60%" height={14} className="cv-skeleton-gap" />
        </div>
      </div>

      <div className="cv-stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="panel cv-skeleton-stat" key={i}>
            <Skeleton width={44} height={44} circle />
            <div>
              <Skeleton width={50} height={20} />
              <Skeleton width={70} height={12} className="cv-skeleton-gap" />
            </div>
          </div>
        ))}
      </div>

      <div className="cv-columns">
        <div className="cv-main-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="panel cv-section" key={i}>
              <Skeleton width="30%" height={16} className="cv-skeleton-gap" />
              <div className="detail-grid">
                {Array.from({ length: 6 }).map((__, j) => (
                  <Skeleton key={j} height={38} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="cv-side-col">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="panel cv-section" key={i}>
              <Skeleton width="50%" height={16} className="cv-skeleton-gap" />
              <div className="detail-grid cv-settings-grid">
                {Array.from({ length: 4 }).map((__, j) => (
                  <Skeleton key={j} height={38} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
