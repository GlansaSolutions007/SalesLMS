import { useCallback, useEffect, useState } from "react";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import MultiSelectDropdown from "../../components/MultiSelectDropdown.jsx";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getBatchEnrollments,
  enrollBatchEmployees,
  updateBatchEnrollment,
  unenrollBatchEmployee,
} from "../../services/api/companyApi.js";

const COMPLETION_OPTIONS = ["Not Started", "In Progress", "Completed", "Dropped"];

export default function BatchEnrollments({ companyId, batchId }) {
  const { token } = useAuth();
  const { options: employeeOptions, isLoading: employeesLoading } = useCompanyEmployeeOptions(companyId);

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedToEnroll, setSelectedToEnroll] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getBatchEnrollments(companyId, batchId, token)
      .then(setEnrollments)
      .catch((err) => setError(err.message ?? "Could not load enrollments."))
      .finally(() => setLoading(false));
  }, [companyId, batchId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const enrolledIds = new Set(enrollments.map((e) => e.employee_id));
  const availableEmployees = employeeOptions.filter((e) => !enrolledIds.has(e.id));

  async function handleEnroll() {
    if (selectedToEnroll.length === 0) return;
    setEnrolling(true);
    try {
      const result = await enrollBatchEmployees(companyId, batchId, selectedToEnroll.map(Number), token);
      setSelectedToEnroll([]);
      load();
      setToast({ tone: "success", message: `${result?.enrolled ?? selectedToEnroll.length} employee(s) enrolled.` });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not enroll employees." });
    } finally {
      setEnrolling(false);
    }
  }

  async function handleStatusChange(enrollment, completion_status) {
    setUpdatingId(enrollment.id);
    try {
      await updateBatchEnrollment(companyId, batchId, enrollment.id, { completion_status }, token);
      setEnrollments((prev) => prev.map((e) => (e.id === enrollment.id ? { ...e, completion_status } : e)));
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update status." });
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await unenrollBatchEmployee(companyId, batchId, removeTarget.id, token);
      setRemoveTarget(null);
      load();
      setToast({ tone: "success", message: "Employee unenrolled." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not unenroll this employee." });
    } finally {
      setRemoving(false);
    }
  }

  return (
    // Deliberately not `.wizard-panel` here — that class sets
    // `overflow: hidden` (for the step-transition animation elsewhere),
    // which clips this MultiSelectDropdown's absolutely-positioned options
    // list right at the panel edge instead of letting it overlay below.
    <div className="panel" style={{ marginTop: 16, padding: 26 }}>
      <div className="wizard-panel-inner">
        <div className="rl-section-label" style={{ marginBottom: 12 }}>
          Enrolled Employees
          {enrollments.length > 0 && <span className="rl-perm-selected-count">{enrollments.length}</span>}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <MultiSelectDropdown
              options={availableEmployees}
              getOptionValue={(e) => e.id}
              getOptionLabel={(e) => e.full_name}
              getOptionSubLabel={(e) => e.employee_code}
              selectedValues={selectedToEnroll}
              onChange={setSelectedToEnroll}
              disabled={employeesLoading}
              placeholder={employeesLoading ? "Loading employees…" : "Select employees to enroll…"}
            />
          </div>
          <button type="button" className="dash-primary-btn cl-add-btn" disabled={selectedToEnroll.length === 0 || enrolling} onClick={handleEnroll}>
            {enrolling ? "Enrolling…" : "Enroll"}
          </button>
        </div>

        {error && <p className="rl-api-error">{error}</p>}

        {loading ? (
          <p className="ep-empty-note">Loading enrollments…</p>
        ) : enrollments.length === 0 ? (
          <p className="ep-empty-note">No employees enrolled in this batch yet.</p>
        ) : (
          <div className="dtable-wrap">
            <table className="dtable form-doc-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Enrolled Date</th>
                  <th>Completion Status</th>
                  <th>Certificate</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <p className="emp-name">{e.employee?.full_name}</p>
                      <p className="emp-code">{e.employee?.employee_code}</p>
                    </td>
                    <td>{e.enrolled_date ? String(e.enrolled_date).slice(0, 10) : "—"}</td>
                    <td>
                      <select
                        className="form-doc-select"
                        value={e.completion_status}
                        disabled={updatingId === e.id}
                        onChange={(ev) => handleStatusChange(e, ev.target.value)}
                      >
                        {COMPLETION_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Badge tone={e.certificate_status === "Issued" ? "green" : "gray"}>{e.certificate_status}</Badge>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dash-icon-btn"
                        aria-label={`Unenroll ${e.employee?.full_name}`}
                        title="Unenroll"
                        disabled={e.completion_status === "Completed"}
                        onClick={() => setRemoveTarget(e)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Unenroll Employee"
          message={`Remove ${removeTarget.employee?.full_name} from this batch?`}
          confirmLabel={removing ? "Removing…" : "Unenroll"}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </div>
  );
}
