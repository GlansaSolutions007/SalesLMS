import { useEffect, useState } from "react";
import Modal from "../Modal.jsx";
import Badge from "../Badge.jsx";
import Icon from "../Icon.jsx";
import DataTable from "../DataTable.jsx";
import Toast from "../Toast.jsx";
import { getInvoices, downloadInvoice } from "../../services/paymentService.js";
import { formatCurrency, formatDate, PAYMENT_TYPE_LABEL } from "../../pages/company/companyDisplay.jsx";

export default function InvoicesModal({ company, token, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getInvoices(company.id, { per_page: 100 }, token)
      .then((res) => setItems(res.data?.data?.data ?? res.data?.data ?? []))
      .catch((err) => setError(err?.response?.data?.message ?? "Could not load invoices."))
      .finally(() => setLoading(false));
  }, [company.id, token]);

  async function handleDownload(invoice) {
    setBusyId(invoice.id);
    try {
      const blob = await downloadInvoice(company.id, invoice.id, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_no}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ tone: "error", message: "Could not download invoice." });
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    { key: "invoice_no", header: "Invoice No." },
    { key: "invoice_date", header: "Date", render: (r) => formatDate(r.invoice_date) },
    { key: "payment_type", header: "Type", render: (r) => PAYMENT_TYPE_LABEL[r.payment_transaction?.payment_type] ?? r.meta?.payment_type ?? "—" },
    { key: "total_amount", header: "Amount", render: (r) => formatCurrency(r.total_amount) },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone="green">{r.payment_transaction?.status ?? "Paid"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="dash-icon-btn" aria-label={`View ${r.invoice_no}`} onClick={() => setDetail(r)}>
            <Icon name="eye" size={15} />
          </button>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Download ${r.invoice_no}`}
            disabled={busyId === r.id}
            onClick={() => handleDownload(r)}
          >
            <Icon name="download" size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal title="Invoices" onClose={onClose} size="lg">
        {error && <p className="cl-error">{error}</p>}
        <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No invoices yet." />
        <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
      </Modal>

      {detail && (
        <Modal title={`Invoice ${detail.invoice_no}`} onClose={() => setDetail(null)}>
          <div className="detail-grid">
            <div><span>Invoice Date</span><p>{formatDate(detail.invoice_date)}</p></div>
            <div><span>Plan</span><p>{detail.meta?.plan_name ?? "—"}</p></div>
            {detail.meta?.payment_type === "SEAT_INCREASE" ? (
              <>
                <div><span>Previous Employee Limit</span><p>{detail.meta?.previous_employee_limit ?? "—"}</p></div>
                <div><span>Additional Employees</span><p>{detail.meta?.additional_employees ?? "—"}</p></div>
                <div><span>New Employee Limit</span><p>{detail.meta?.new_employee_limit ?? "—"}</p></div>
                <div><span>Additional Amount</span><p>{formatCurrency(detail.subtotal)}</p></div>
              </>
            ) : (
              <>
                <div><span>Billing Cycle</span><p>{detail.meta?.billing_cycle ?? "—"}</p></div>
                <div><span>Employee Count</span><p>{detail.meta?.employee_count ?? "—"}</p></div>
                <div><span>Subtotal</span><p>{formatCurrency(detail.subtotal)}</p></div>
              </>
            )}
            <div><span>Tax ({detail.tax_percent}%)</span><p>{formatCurrency(detail.tax_amount)}</p></div>
            <div><span>Total Amount</span><p><strong>{formatCurrency(detail.total_amount)}</strong></p></div>
          </div>
        </Modal>
      )}
    </>
  );
}
