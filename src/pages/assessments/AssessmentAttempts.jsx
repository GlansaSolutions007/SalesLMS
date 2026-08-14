import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import { getAssessment, listAttempts, deleteAttempt } from "../../services/courseService.js";
import { ROUTES } from "../../router/routePaths.js";
import GradeAttemptModal from "./GradeAttemptModal.jsx";

const STATUS_TONE = { "In Progress": "gray", Submitted: "orange", Evaluated: "blue" };
const RESULT_TONE = { Pass: "green", Fail: "red" };

export default function AssessmentAttempts() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { assessmentId } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1, from: 1, to: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [gradingAttemptId, setGradingAttemptId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getAssessment(assessmentId)
      .then(setAssessment)
      .catch(() => {});
  }, [assessmentId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAttempts(assessmentId, { page, per_page: 25 });
      setAttempts(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message ?? "Could not load attempts.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteAttempt(assessmentId, deleteTarget.id);
      setDeleteTarget(null);
      load();
      setToast({ tone: "success", message: "Attempt deleted." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete attempt." });
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <div>
          <p className="emp-name">{r.employee?.full_name ?? "—"}</p>
          <p className="emp-code">{r.employee?.employee_code ?? "—"}</p>
        </div>
      ),
    },
    { key: "attempt_no", header: "Attempt #" },
    { key: "score", header: "Score", render: (r) => (r.score != null ? r.score : "—") },
    { key: "percentage", header: "%", render: (r) => (r.percentage != null ? `${r.percentage}%` : "—") },
    { key: "result", header: "Result", render: (r) => (r.result ? <Badge tone={RESULT_TONE[r.result] ?? "gray"}>{r.result}</Badge> : "—") },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          {r.status === "Submitted" && (
            <button type="button" className="dash-icon-btn" aria-label="Evaluate" title="Evaluate" onClick={() => setGradingAttemptId(r.id)}>
              <Icon name="edit" size={15} />
            </button>
          )}
          {r.status === "Evaluated" && (
            <button type="button" className="dash-icon-btn" aria-label="View evaluation" title="View / Re-grade" onClick={() => setGradingAttemptId(r.id)}>
              <Icon name="eye" size={15} />
            </button>
          )}
          <button type="button" className="dash-icon-btn" aria-label="Delete attempt" title="Delete" onClick={() => setDeleteTarget(r)}>
            <Icon name="trash" size={15} />
          </button>
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
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.ASSESSMENTS)}>
              <Icon name="back" size={15} />
              Back to Assessments
            </button>
            <h1>{assessment?.assessment_title ?? "Attempts"}</h1>
            <Breadcrumb current="Attempts" />
          </div>
        </div>

        <div className="panel cl-panel">
          {error && <p className="cl-error">{error}</p>}

          <DataTable columns={columns} rows={attempts} isLoading={loading} emptyMessage="No attempts recorded for this assessment yet." />

          {!loading && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} attempt{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {gradingAttemptId && (
        <GradeAttemptModal
          assessmentId={assessmentId}
          attemptId={gradingAttemptId}
          onClose={() => setGradingAttemptId(null)}
          onSaved={() => {
            setGradingAttemptId(null);
            load();
            setToast({ tone: "success", message: "Evaluation saved." });
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Attempt"
          message={`This will permanently delete ${deleteTarget.employee?.full_name ?? "this"}'s attempt #${deleteTarget.attempt_no}.`}
          confirmLabel={actionLoading ? "Deleting…" : "Delete"}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
