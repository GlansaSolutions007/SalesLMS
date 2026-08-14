import { useEffect, useState } from "react";
import Modal from "../Modal.jsx";
import FormField from "../FormField.jsx";
import Badge from "../Badge.jsx";
import Icon from "../Icon.jsx";
import DataTable from "../DataTable.jsx";
import Toast from "../Toast.jsx";
import {
  getPaymentTransactions,
  getPaymentTransaction,
  getRefunds,
  retryPayment,
  requestRefund,
  verifyPayment,
  downloadInvoice,
} from "../../services/paymentService.js";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout.js";
import { formatCurrency, formatDate, PAYMENT_TXN_STATUS_TONE, PAYMENT_TYPE_LABEL } from "../../pages/company/companyDisplay.jsx";

async function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PaymentHistoryModal({ company, token, user, isSuperAdmin, onClose, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    getPaymentTransactions(company.id, { per_page: 100 }, token)
      .then((res) => setItems(res.data?.data?.data ?? res.data?.data ?? []))
      .catch((err) => setError(err?.response?.data?.message ?? "Could not load payment history."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [company.id, token]);

  async function handleRetry(row) {
    setBusyId(row.id);
    try {
      const res = await retryPayment(company.id, row.id, token);
      const order = res.data?.data ?? res.data;

      openRazorpayCheckout({
        keyId: order.razorpay_key_id,
        orderId: order.razorpay_order_id,
        amount: order.amount,
        currency: order.currency,
        name: company.company_name,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (payload) => {
          try {
            await verifyPayment(company.id, order.transaction_id, payload, token);
            setToast({ tone: "success", message: "Payment successful. Your subscription has been updated." });
            load();
            onChanged?.();
          } catch (err) {
            setToast({ tone: "error", message: err?.response?.data?.message ?? "Payment could not be verified." });
          } finally {
            setBusyId(null);
          }
        },
        onFailure: (err) => {
          setBusyId(null);
          setToast({ tone: "error", message: err.message ?? "Payment failed. Please try again." });
          load();
        },
        onDismiss: () => setBusyId(null),
      });
    } catch (err) {
      setBusyId(null);
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not retry payment." });
    }
  }

  async function handleDownloadInvoice(row) {
    if (!row.invoice?.id) return;
    setBusyId(row.id);
    try {
      const blob = await downloadInvoice(company.id, row.invoice.id, token);
      await triggerBlobDownload(blob, `${row.invoice.invoice_no}.pdf`);
    } catch {
      setToast({ tone: "error", message: "Could not download invoice." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleView(row) {
    try {
      const [txnRes, refundsRes] = await Promise.all([
        getPaymentTransaction(company.id, row.id, token),
        getRefunds(company.id, row.id, token),
      ]);
      setDetail({ transaction: txnRes.data?.data ?? txnRes.data, refunds: refundsRes.data?.data ?? refundsRes.data ?? [] });
    } catch {
      setToast({ tone: "error", message: "Could not load transaction details." });
    }
  }

  const columns = [
    { key: "transaction_no", header: "Transaction No." },
    { key: "razorpay_order_id", header: "Razorpay Order ID" },
    { key: "subscription", header: "Subscription", render: (r) => r.subscription?.subscription_no ?? "—" },
    { key: "payment_type", header: "Payment Type", render: (r) => PAYMENT_TYPE_LABEL[r.payment_type] ?? r.payment_type },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "payment_method", header: "Method", render: (r) => r.payment_method ?? "—" },
    { key: "paid_at", header: "Payment Date", render: (r) => formatDate(r.paid_at) },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={PAYMENT_TXN_STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="dash-icon-btn" aria-label={`View ${r.transaction_no}`} onClick={() => handleView(r)}>
            <Icon name="eye" size={15} />
          </button>
          {r.invoice?.id && (
            <button
              type="button"
              className="dash-icon-btn"
              aria-label={`Download invoice for ${r.transaction_no}`}
              disabled={busyId === r.id}
              onClick={() => handleDownloadInvoice(r)}
            >
              <Icon name="download" size={15} />
            </button>
          )}
          {r.status === "Failed" && (
            <button type="button" className="cl-btn" disabled={busyId === r.id} onClick={() => handleRetry(r)}>
              {busyId === r.id ? "Retrying…" : "Retry Payment"}
            </button>
          )}
          {isSuperAdmin && ["Paid", "Partially Refunded"].includes(r.status) && (
            <button type="button" className="cl-btn tp-deactivate-btn" onClick={() => setRefundTarget(r)}>
              Refund
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal title="Payment History" onClose={onClose} size="lg">
        {error && <p className="cl-error">{error}</p>}
        <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No payment transactions yet." />
        <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
      </Modal>

      {detail && (
        <Modal title={`Transaction ${detail.transaction.transaction_no}`} onClose={() => setDetail(null)}>
          <div className="detail-grid">
            <div><span>Payment Type</span><p>{PAYMENT_TYPE_LABEL[detail.transaction.payment_type] ?? detail.transaction.payment_type}</p></div>
            <div><span>Razorpay Order ID</span><p>{detail.transaction.razorpay_order_id}</p></div>
            <div><span>Razorpay Payment ID</span><p>{detail.transaction.razorpay_payment_id ?? "—"}</p></div>
            <div><span>Amount</span><p>{formatCurrency(detail.transaction.amount)}</p></div>
            <div><span>Currency</span><p>{detail.transaction.currency}</p></div>
            <div><span>Payment Method</span><p>{detail.transaction.payment_method ?? "—"}</p></div>
            <div><span>Status</span><p><Badge tone={PAYMENT_TXN_STATUS_TONE[detail.transaction.status] ?? "gray"}>{detail.transaction.status}</Badge></p></div>
            <div><span>Paid At</span><p>{formatDate(detail.transaction.paid_at)}</p></div>
            {detail.transaction.status === "Failed" && (
              <>
                <div><span>Failure Reason</span><p>{detail.transaction.failure_reason ?? "—"}</p></div>
                <div><span>Failure Description</span><p>{detail.transaction.failure_description ?? "—"}</p></div>
              </>
            )}
          </div>
          {detail.refunds.length > 0 && (
            <>
              <h3 className="cv-section-title" style={{ marginTop: 16 }}>Refund History</h3>
              {detail.refunds.map((r) => (
                <div key={r.id} className="detail-grid" style={{ marginBottom: 8 }}>
                  <div><span>Amount</span><p>{formatCurrency(r.amount)}</p></div>
                  <div><span>Type</span><p>{r.type}</p></div>
                  <div><span>Status</span><p>{r.status}</p></div>
                  <div><span>Date</span><p>{formatDate(r.processed_at ?? r.created_at)}</p></div>
                </div>
              ))}
            </>
          )}
        </Modal>
      )}

      {refundTarget && (
        <RefundDialog
          company={company}
          token={token}
          transaction={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={() => {
            setRefundTarget(null);
            load();
            onChanged?.();
          }}
        />
      )}
    </>
  );
}

function RefundDialog({ company, token, transaction, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await requestRefund(company.id, transaction.id, { amount: amount ? Number(amount) : undefined, reason }, token);
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Could not initiate refund.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Refund ${transaction.transaction_no}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="dash-primary-btn cl-add-btn" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Processing…" : "Initiate Refund"}
          </button>
        </>
      }
    >
      {error && <p className="cl-error">{error}</p>}
      <p style={{ marginTop: 0, color: "var(--color-muted)", fontSize: 13 }}>
        Amount paid: {formatCurrency(transaction.amount)}. Leave amount blank for a full refund of whatever remains.
      </p>
      <FormField label="Refund Amount (optional — blank = full remaining amount)">
        <input type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </FormField>
      <FormField label="Reason (optional)">
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </FormField>
    </Modal>
  );
}
