import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import DataTable from "../../components/DataTable.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getAdminRenewalRequest,
  updateRenewalRequest,
  activateRenewalRequest,
  rejectRenewalRequest,
} from "../../services/renewalRequestService.js";
import { getSubscriptionPlans } from "../../services/subscriptionService.js";
import { ROUTES, companyViewPath } from "../../router/routePaths.js";
import {
  PAYMENT_TXN_STATUS_TONE,
  PAYMENT_TYPE_LABEL,
  SUBSCRIPTION_STATUS_TONE,
  formatDate,
  formatCurrency,
  DetailField,
} from "../company/companyDisplay.jsx";
import "../company/CompanyList.css";
import "../company/CompanyView.css";

const REQUEST_STATUS_TONE = { Pending: "orange", Approved: "blue", Completed: "green", Rejected: "red", Cancelled: "gray" };
const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Failed", "Refunded"];
const PAYMENT_METHOD_OPTIONS = ["Bank Transfer", "Cash", "Razorpay", "UPI", "Card", "Other"];
const BILLING_CYCLE_OPTIONS = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];

const PAYMENT_HISTORY_COLUMNS = [
  { key: "transaction_no", header: "Transaction No." },
  { key: "payment_type", header: "Type", render: (r) => PAYMENT_TYPE_LABEL[r.payment_type] ?? r.payment_type },
  { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
  { key: "payment_method", header: "Method", render: (r) => r.payment_method ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={PAYMENT_TXN_STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge>,
  },
  { key: "paid_at", header: "Paid On", render: (r) => formatDate(r.paid_at) },
];

// Super Admin's "review + record payment + set new period + activate"
// screen — the one place where a renewal request actually turns into a
// real, Active subscription. Payment fields and the new-period fields are
// staged here via one combined PUT/POST and only take effect once
// [Activate Subscription] runs, which the backend refuses unless
// payment_status is already Paid with full details.
export default function RenewalRequestView() {
  const { id } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [plans, setPlans] = useState([]);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [form, setForm] = useState({
    plan_id: "", start_date: "", end_date: "", employee_limit: "", price_per_employee: "",
    billing_cycle: "", amount: "",
    payment_status: "Pending", payment_method: "", payment_reference: "", payment_date: "",
    payment_amount: "", payment_currency: "INR", payment_notes: "", admin_notes: "",
    payment_proof: null,
  });

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminRenewalRequest(id, token);
      const body = res.data?.data;
      setDetail(body);
      const rr = body?.renewal_request;
      if (rr) {
        setForm({
          plan_id: rr.requested_plan_id ?? rr.subscription?.plan_id ?? "",
          start_date: rr.requested_start_date ?? "",
          end_date: rr.requested_end_date ?? "",
          employee_limit: rr.requested_employee_limit ?? "",
          price_per_employee: rr.requested_price_per_employee ?? "",
          billing_cycle: rr.requested_billing_cycle ?? "",
          amount: rr.requested_amount ?? "",
          payment_status: rr.payment_status ?? "Pending",
          payment_method: rr.payment_method ?? "",
          payment_reference: rr.payment_reference ?? "",
          payment_date: rr.payment_date ?? "",
          payment_amount: rr.payment_amount ?? "",
          payment_currency: rr.payment_currency ?? "INR",
          payment_notes: rr.payment_notes ?? "",
          admin_notes: rr.admin_notes ?? "",
          payment_proof: null,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? "Could not load this renewal request.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getSubscriptionPlans({ status: "Active", per_page: 100 }, token)
      .then((res) => setPlans(res.data?.data?.data ?? res.data?.data ?? []))
      .catch(() => setPlans([]));
  }, [token]);

  const rr = detail?.renewal_request;
  const isFinalized = rr && ["Completed", "Rejected", "Cancelled"].includes(rr.status);
  const canActivate =
    form.payment_status === "Paid" && form.payment_amount && form.payment_method && form.payment_date && form.payment_reference;

  async function handleSave() {
    setSaving(true);
    try {
      await updateRenewalRequest(id, form, token);
      setToast({ tone: "success", message: "Renewal request updated." });
      load();
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not save changes." });
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    setSaving(true);
    try {
      const res = await activateRenewalRequest(id, token);
      setActivateOpen(false);
      setToast({ tone: "success", message: res.data?.message ?? "Subscription renewed and activated." });
      load();
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not activate the renewal." });
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setSaving(true);
    try {
      await rejectRenewalRequest(id, rejectionReason.trim(), token);
      setRejectOpen(false);
      setRejectionReason("");
      setToast({ tone: "success", message: "Renewal request rejected." });
      load();
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not reject the request." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Renewal Request {rr?.request_number ?? ""}</h1>
            <Breadcrumb current={rr?.request_number ?? "Renewal Request"} />
          </div>
          <div className="cv-header-actions">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.MASTERS_RENEWAL_REQUESTS)}>
              <Icon name="back" size={15} />
              Back
            </button>
            {rr && (
              <Badge tone={REQUEST_STATUS_TONE[rr.status] ?? "gray"}>{rr.status}</Badge>
            )}
          </div>
        </div>

        {loading && (
          <div className="panel cv-section">
            <Skeleton height={200} />
          </div>
        )}

        {!loading && error && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this renewal request</h3>
            <p>{error}</p>
            <button type="button" className="cl-btn" onClick={load}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {!loading && rr && (
          <div className="cv-columns">
            <div className="cv-main-col">
              <section className="panel cv-section">
                <h3 className="cv-section-title">Company Details</h3>
                <div className="detail-grid">
                  <DetailField label="Company Name">{rr.company?.company_name}</DetailField>
                  <DetailField label="Company ID">{rr.company?.id}</DetailField>
                  <DetailField label="Admin Name">{detail.company_admin?.name}</DetailField>
                  <DetailField label="Admin Email">{detail.company_admin?.email}</DetailField>
                </div>
                <button type="button" className="cl-btn" style={{ marginTop: 10 }} onClick={() => navigate(companyViewPath(rr.company?.id))}>
                  View Company Profile
                </button>
              </section>

              <section className="panel cv-section">
                <h3 className="cv-section-title">Current Subscription</h3>
                <div className="detail-grid">
                  <DetailField label="Plan">{rr.subscription?.plan?.plan_name}</DetailField>
                  <DetailField label="Subscription Number">{rr.subscription?.subscription_no}</DetailField>
                  <DetailField label="Start Date">{formatDate(rr.subscription?.start_date)}</DetailField>
                  <DetailField label="End Date">{formatDate(rr.subscription?.end_date)}</DetailField>
                  <DetailField label="Employee Limit">{rr.subscription?.employee_limit ?? "Unlimited"}</DetailField>
                  <DetailField label="Employees Used">{detail.employees_used}</DetailField>
                  <DetailField label="Current Status">
                    <Badge tone={SUBSCRIPTION_STATUS_TONE[rr.subscription?.effective_status] ?? "gray"}>
                      {rr.subscription?.effective_status ?? "—"}
                    </Badge>
                  </DetailField>
                </div>
              </section>

              <section className="panel cv-section">
                <h3 className="cv-section-title">Renewal Request Details</h3>
                <div className="detail-grid">
                  <DetailField label="Request Date">{formatDate(rr.requested_at)}</DetailField>
                  <DetailField label="Requested By">{rr.requested_by?.name}</DetailField>
                  <DetailField label="Admin Message">{rr.message || "—"}</DetailField>
                </div>
                {rr.status === "Rejected" && rr.rejection_reason && (
                  <p className="cv-inline-hint" style={{ color: "var(--color-danger, #b91c1c)" }}>
                    Rejection reason: {rr.rejection_reason}
                  </p>
                )}
              </section>

              <section className="panel cv-section">
                <h3 className="cv-section-title">Payment History</h3>
                <DataTable columns={PAYMENT_HISTORY_COLUMNS} rows={detail.payment_history ?? []} emptyMessage="No payment history yet." />
              </section>

              {!isFinalized && (
                <>
                  <section className="panel cv-section">
                    <h3 className="cv-section-title">New Subscription Period</h3>
                    <div className="detail-grid">
                      <FormField label="Plan">
                        <select value={form.plan_id} onChange={(e) => updateField("plan_id", e.target.value)}>
                          <option value="">Keep current plan</option>
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>{p.plan_name} — {formatCurrency(p.price_per_employee)}/employee</option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="New Start Date">
                        <input type="date" value={form.start_date ?? ""} onChange={(e) => updateField("start_date", e.target.value)} />
                      </FormField>
                      <FormField label="New End Date">
                        <input type="date" value={form.end_date ?? ""} onChange={(e) => updateField("end_date", e.target.value)} />
                      </FormField>
                      <FormField label="Employee Limit">
                        <input type="number" min={1} value={form.employee_limit ?? ""} onChange={(e) => updateField("employee_limit", e.target.value)} />
                      </FormField>
                      <FormField label="Price Per Employee">
                        <input type="number" min={0} step="0.01" value={form.price_per_employee ?? ""} onChange={(e) => updateField("price_per_employee", e.target.value)} />
                      </FormField>
                      <FormField label="Billing Cycle">
                        <select value={form.billing_cycle ?? ""} onChange={(e) => updateField("billing_cycle", e.target.value)}>
                          <option value="">Keep current</option>
                          {BILLING_CYCLE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Amount">
                        <input type="number" min={0} step="0.01" value={form.amount ?? ""} onChange={(e) => updateField("amount", e.target.value)} />
                      </FormField>
                    </div>
                  </section>

                  <section className="panel cv-section">
                    <h3 className="cv-section-title">Payment Details</h3>
                    <div className="detail-grid">
                      <FormField label="Payment Status">
                        <select value={form.payment_status} onChange={(e) => updateField("payment_status", e.target.value)}>
                          {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Payment Method">
                        <select value={form.payment_method ?? ""} onChange={(e) => updateField("payment_method", e.target.value)}>
                          <option value="">Select method…</option>
                          {PAYMENT_METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Transaction / Reference Number">
                        <input type="text" maxLength={150} value={form.payment_reference ?? ""} onChange={(e) => updateField("payment_reference", e.target.value)} />
                      </FormField>
                      <FormField label="Payment Date">
                        <input type="date" value={form.payment_date ?? ""} onChange={(e) => updateField("payment_date", e.target.value)} />
                      </FormField>
                      <FormField label="Amount">
                        <input type="number" min={0} step="0.01" value={form.payment_amount ?? ""} onChange={(e) => updateField("payment_amount", e.target.value)} />
                      </FormField>
                      <FormField label="Currency">
                        <input type="text" maxLength={10} value={form.payment_currency ?? "INR"} onChange={(e) => updateField("payment_currency", e.target.value)} />
                      </FormField>
                      <FormField label="Payment Proof / Receipt (optional)">
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => updateField("payment_proof", e.target.files?.[0] ?? null)} />
                      </FormField>
                    </div>
                    <FormField label="Payment Notes">
                      <textarea rows={2} value={form.payment_notes ?? ""} onChange={(e) => updateField("payment_notes", e.target.value)} />
                    </FormField>
                    <FormField label="Admin Notes">
                      <textarea rows={2} value={form.admin_notes ?? ""} onChange={(e) => updateField("admin_notes", e.target.value)} />
                    </FormField>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button type="button" className="cl-btn" disabled={saving} onClick={handleSave}>
                        {saving ? "Saving…" : "Save Details"}
                      </button>
                      <button type="button" className="cl-btn tp-deactivate-btn" disabled={saving} onClick={() => setRejectOpen(true)}>
                        Reject Request
                      </button>
                    </div>
                  </section>

                  <section className="panel cv-section">
                    <h3 className="cv-section-title">Renew Subscription</h3>
                    <div className="detail-grid">
                      <DetailField label="Company">{rr.company?.company_name}</DetailField>
                      <DetailField label="Current Plan">{rr.subscription?.plan?.plan_name}</DetailField>
                      <DetailField label="Current End Date">{formatDate(rr.subscription?.end_date)}</DetailField>
                      <DetailField label="New Start Date">{formatDate(form.start_date) || "—"}</DetailField>
                      <DetailField label="New End Date">{formatDate(form.end_date) || "—"}</DetailField>
                      <DetailField label="Amount">{formatCurrency(form.payment_amount || form.amount)}</DetailField>
                      <DetailField label="Payment Status">
                        <Badge tone={form.payment_status === "Paid" ? "green" : "orange"}>{form.payment_status}</Badge>
                      </DetailField>
                      <DetailField label="Payment Method">{form.payment_method || "—"}</DetailField>
                      <DetailField label="Transaction Number">{form.payment_reference || "—"}</DetailField>
                    </div>
                    {!canActivate && (
                      <p className="cv-inline-hint">
                        Save payment details (Status = Paid, Amount, Method, Date, Reference Number) before activating.
                      </p>
                    )}
                    <button
                      type="button"
                      className="dash-primary-btn cl-add-btn"
                      disabled={!canActivate || saving}
                      onClick={() => setActivateOpen(true)}
                    >
                      Activate Subscription
                    </button>
                  </section>
                </>
              )}

              {isFinalized && rr.status === "Completed" && (
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Activated Subscription</h3>
                  <div className="detail-grid">
                    <DetailField label="Plan">{rr.new_subscription?.plan?.plan_name}</DetailField>
                    <DetailField label="Subscription Number">{rr.new_subscription?.subscription_no}</DetailField>
                    <DetailField label="Start Date">{formatDate(rr.new_subscription?.start_date)}</DetailField>
                    <DetailField label="End Date">{formatDate(rr.new_subscription?.end_date)}</DetailField>
                    <DetailField label="Amount">{formatCurrency(rr.new_subscription?.amount)}</DetailField>
                    <DetailField label="Payment Status">
                      <Badge tone="green">{rr.new_subscription?.payment_status}</Badge>
                    </DetailField>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>

      {activateOpen && (
        <ConfirmDialog
          title="Activate Subscription"
          message={`Renew ${rr?.company?.company_name}'s subscription with the terms and payment details you just saved? This creates a new active subscription and cannot be undone from here.`}
          confirmLabel={saving ? "Activating…" : "Activate Subscription"}
          onCancel={() => setActivateOpen(false)}
          onConfirm={handleActivate}
        />
      )}

      {rejectOpen && (
        <Modal
          title="Reject Renewal Request"
          onClose={() => setRejectOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setRejectOpen(false)}>Cancel</button>
              <button type="button" className="dash-primary-btn confirm-danger-btn" disabled={saving || !rejectionReason.trim()} onClick={handleReject}>
                {saving ? "Rejecting…" : "Reject Request"}
              </button>
            </>
          }
        >
          <FormField label="Rejection Reason (required)">
            <textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </FormField>
        </Modal>
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
