import { useEffect, useState } from "react";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getLeadConversions, verifyLeadConversion } from "../../services/api/leadsApi.js";

const STATUS_TONE = { pending: "orange", "more info requested": "blue", approved: "green", rejected: "red" };

export default function LeadVerificationQueue() {
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [conversions, setConversions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setConversions([]);
      return;
    }
    setIsLoading(true);
    getLeadConversions(companyId, { status: undefined })
      .then((res) => setConversions(res.items.filter((c) => c.status === "Pending" || c.status === "More Info Requested")))
      .catch(() => setConversions([]))
      .finally(() => setIsLoading(false));
  }, [companyId, refreshKey]);

  const columns = [
    { key: "lead", header: "Lead", render: (r) => r.lead?.full_name || "—" },
    { key: "employee", header: "Submitted By", render: (r) => r.employee?.full_name || "—" },
    { key: "converted_amount", header: "Amount", render: (r) => `₹${Number(r.converted_amount).toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" className="dash-primary-btn" onClick={() => setVerifyTarget(r)}>
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="panel cl-panel">
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}

      <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
        {isSuperAdmin && (
          <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <DataTable columns={columns} rows={conversions} isLoading={isLoading} emptyMessage="No conversions awaiting verification." />

      {verifyTarget && (
        <VerifyModal
          companyId={companyId}
          conversion={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onDone={() => {
            setVerifyTarget(null);
            setRefreshKey((k) => k + 1);
            setToast({ tone: "success", message: "Conversion updated." });
          }}
        />
      )}
    </div>
  );
}

function VerifyModal({ companyId, conversion, onClose, onDone }) {
  const [decision, setDecision] = useState("Approved");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setIsSubmitting(true);
    setError("");
    try {
      await verifyLeadConversion(companyId, conversion.id, { decision, verification_remarks: remarks || undefined });
      onDone();
    } catch (err) {
      setError(err.message ?? "Could not verify this conversion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Review Conversion — ${conversion.lead?.full_name ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="dash-primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Submit"}
          </button>
        </>
      }
    >
      <div className="form-fields-stack">
        <p>
          Amount: <strong>₹{Number(conversion.converted_amount).toLocaleString()}</strong>
        </p>
        {conversion.remarks && <p>Employee remarks: {conversion.remarks}</p>}

        <FormField label="Decision">
          <div className="seg-group">
            {["Approved", "Rejected", "More Info Requested"].map((opt) => (
              <button key={opt} type="button" className={`seg-chip${decision === opt ? " is-active" : ""}`} onClick={() => setDecision(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Remarks">
          <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </FormField>

        {error && <p className="form-field-error">{error}</p>}
      </div>
    </Modal>
  );
}
