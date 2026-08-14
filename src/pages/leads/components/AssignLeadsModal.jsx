import { useState } from "react";
import Modal from "../../../components/Modal.jsx";
import FormField from "../../../components/FormField.jsx";
import { assignLeads } from "../../../services/api/leadsApi.js";
import useCompanyEmployeeOptions from "../../employees/useCompanyEmployeeOptions.js";

// Leads are assigned ONLY to individual employees — there is no Team
// option here. The same action covers first-time assignment, reassignment,
// and bulk assignment; they only differ by how many lead IDs are passed.
export default function AssignLeadsModal({ companyId, leadIds, onClose, onAssigned }) {
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const { options: employees } = useCompanyEmployeeOptions(companyId);

  async function handleAssign() {
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const res = await assignLeads(companyId, {
        lead_ids: leadIds,
        employee_id: employeeId,
        reason: reason || undefined,
      });
      setResult(res);
      onAssigned?.();
    } catch (err) {
      setError(err.message ?? "Could not assign leads.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Assign ${leadIds.length} Lead(s)`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button type="button" className="dash-primary-btn" onClick={handleAssign} disabled={isSubmitting}>
              {isSubmitting ? "Assigning…" : "Assign"}
            </button>
          )}
        </>
      }
    >
      {!result ? (
        <div className="form-fields-stack">
          <FormField label="Employee">
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Reason (optional — useful when reassigning)">
            <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>

          {error && <p className="form-field-error">{error}</p>}
        </div>
      ) : (
        <div className="form-fields-stack">
          <p>
            <strong>{result.assigned}</strong> lead(s) assigned. {result.skipped > 0 && <span>{result.skipped} were already assigned to this employee, skipped.</span>}
          </p>
        </div>
      )}
    </Modal>
  );
}
