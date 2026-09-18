import { useState } from "react";
import Modal from "../../../components/Modal.jsx";
import FormField from "../../../components/FormField.jsx";

// Design-only employee list — see LeadPool.jsx's note on the same pattern.
const DUMMY_EMPLOYEES = [
  { id: 101, full_name: "Arjun Kumar" },
  { id: 102, full_name: "Priya Singh" },
  { id: 103, full_name: "Ravi Verma" },
];

// Leads are assigned ONLY to individual employees — there is no Team
// option here. The same action covers first-time assignment, reassignment,
// and bulk assignment; they only differ by how many lead IDs are passed.
export default function AssignLeadsModal({ leadIds, onClose, onAssigned }) {
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const employees = DUMMY_EMPLOYEES;

  function handleAssign() {
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }
    setError("");
    const employee = employees.find((e) => String(e.id) === String(employeeId));
    setResult({ assigned: leadIds.length, skipped: 0 });
    onAssigned?.({ full_name: employee?.full_name ?? "" });
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
            <button type="button" className="dash-primary-btn" onClick={handleAssign}>
              Assign
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
