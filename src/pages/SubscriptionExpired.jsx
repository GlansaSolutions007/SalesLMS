import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import FormField from "../components/FormField.jsx";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES, subscriptionRenewalPath } from "../router/routePaths.js";
import { getCompanySubscriptions } from "../services/subscriptionService.js";
import { getRenewalRequests, createRenewalRequest } from "../services/renewalRequestService.js";
import { SUBSCRIPTION_STATUS_TONE, formatDate, DetailField } from "./company/companyDisplay.jsx";
import "./placeholder.css";
import "./SubscriptionExpired.css";

const RECHECK_INTERVAL_MS = 20000;

const REQUEST_STATUS_TONE = { Pending: "orange", Approved: "blue", Completed: "green", Rejected: "red", Cancelled: "gray" };

// Landing spot for restricted routes/API calls while a company's
// subscription is lapsed (see ApiAuthenticate + AppRouter's
// GuardedMenuRoute). Polls in the background so that once a Super Admin
// renews the subscription, whoever is sitting on this page is bounced back
// to the Dashboard automatically — "no logout required" per the module spec.
//
// Only a Company Admin can see the subscription details / submit a renewal
// request here — the underlying endpoints (companies/{company}/subscriptions,
// .../subscription-renewal-requests) sit behind the `role:Super Admin,Company
// Admin` route group, so a Trainer/Employee gets 403s from these calls the
// same way they always have from the rest of the subscription section
// (CompanyView.jsx). They see the generic fallback message instead.
export default function SubscriptionExpired() {
  const { roleName, subscriptionExpired, fetchCurrentUser, isSuperAdmin, user, token } = useAuth();
  const navigate = useNavigate();
  const fetchRef = useRef(fetchCurrentUser);
  fetchRef.current = fetchCurrentUser;

  const isCompanyAdmin = roleName === "Company Admin";
  const companyId = user?.company?.id;

  const [subscription, setSubscription] = useState(null);
  const [latestRequest, setLatestRequest] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Super Admin is never restricted — if one lands here directly by URL,
  // there's nothing to show them.
  useEffect(() => {
    if (isSuperAdmin) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    if (!subscriptionExpired) {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return undefined;
    }

    const interval = setInterval(() => {
      fetchRef.current().catch(() => {
        /* transient failure — next tick retries */
      });
    }, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [subscriptionExpired, navigate]);

  function loadDetails() {
    if (!isCompanyAdmin || !companyId) return;
    setLoadingDetails(true);
    Promise.all([
      getCompanySubscriptions(companyId, token).then((res) => res.data?.data ?? []),
      getRenewalRequests(companyId, token).then((res) => res.data?.data ?? []),
    ])
      .then(([subs, requests]) => {
        setSubscription(subs[0] ?? null);
        setLatestRequest(requests[0] ?? null);
      })
      .catch(() => {
        /* best-effort — the generic fallback text still shows */
      })
      .finally(() => setLoadingDetails(false));
  }

  useEffect(loadDetails, [isCompanyAdmin, companyId, token]);

  async function handleSubmitRequest() {
    setSubmitting(true);
    try {
      await createRenewalRequest(companyId, { message: message.trim() || undefined }, token);
      setRequestOpen(false);
      setMessage("");
      setToast({ tone: "success", message: "Renewal request submitted successfully." });
      loadDetails();
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not submit renewal request." });
    } finally {
      setSubmitting(false);
    }
  }

  const renewalPath = subscriptionRenewalPath(roleName);
  const hasPendingRequest = latestRequest?.status === "Pending";

  return (
    <div className="placeholder-wrap se-wrap">
      <div className="placeholder-icon">
        <Icon name="lock" size={26} />
      </div>
      <h1>Subscription Expired</h1>
      <p>
        Your subscription has expired. You can still log in, view your profile, and check your subscription status —
        access to courses, training, reports, and other LMS features will resume automatically as soon as the
        subscription is renewed.
      </p>

      {isCompanyAdmin && subscription && (
        <div className="panel se-detail-panel">
          <div className="detail-grid">
            <DetailField label="Company Name">{user?.company?.company_name}</DetailField>
            <DetailField label="Subscription Plan">{subscription.plan?.plan_name}</DetailField>
            <DetailField label="Subscription Start Date">{formatDate(subscription.start_date)}</DetailField>
            <DetailField label="Subscription End Date">{formatDate(subscription.end_date)}</DetailField>
            <DetailField label="Expired Date">{formatDate(subscription.end_date)}</DetailField>
            <DetailField label="Current Status">
              <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.effective_status] ?? "gray"}>
                {subscription.effective_status ?? "Expired"}
              </Badge>
            </DetailField>
          </div>
        </div>
      )}

      {isCompanyAdmin && latestRequest && (
        <div className={`se-request-status se-request-status-${latestRequest.status?.toLowerCase()}`}>
          <Badge tone={REQUEST_STATUS_TONE[latestRequest.status] ?? "gray"}>{latestRequest.status}</Badge>
          {latestRequest.status === "Pending" && (
            <p>Your subscription renewal request is already pending with the administrator.</p>
          )}
          {latestRequest.status === "Approved" && <p>Your renewal request is under review.</p>}
          {latestRequest.status === "Completed" && <p>Your subscription has been renewed successfully.</p>}
          {latestRequest.status === "Rejected" && (
            <p>
              Your renewal request was rejected.
              {latestRequest.rejection_reason ? ` Reason: ${latestRequest.rejection_reason}` : ""}
            </p>
          )}
        </div>
      )}

      {isCompanyAdmin ? (
        <button
          type="button"
          className="dash-primary-btn"
          disabled={hasPendingRequest || loadingDetails}
          onClick={() => setRequestOpen(true)}
        >
          Request Subscription Renewal
        </button>
      ) : renewalPath ? (
        <button type="button" className="dash-primary-btn" onClick={() => navigate(renewalPath)}>
          Renew Subscription
        </button>
      ) : (
        <button type="button" className="dash-primary-btn" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </button>
      )}

      {requestOpen && (
        <Modal
          title="Request Subscription Renewal"
          onClose={() => setRequestOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setRequestOpen(false)}>Cancel</button>
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={submitting} onClick={handleSubmitRequest}>
                {submitting ? "Submitting…" : "Submit Renewal Request"}
              </button>
            </>
          }
        >
          <div className="detail-grid">
            <DetailField label="Company Name">{user?.company?.company_name}</DetailField>
            <DetailField label="Current Plan">{subscription?.plan?.plan_name}</DetailField>
            <DetailField label="Previous Subscription End Date">{formatDate(subscription?.end_date)}</DetailField>
            <DetailField label="Requested Renewal">Next billing period, same plan (Super Admin confirms final dates)</DetailField>
          </div>
          <FormField label="Optional Message">
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Anything the administrator should know…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </FormField>
        </Modal>
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </div>
  );
}
