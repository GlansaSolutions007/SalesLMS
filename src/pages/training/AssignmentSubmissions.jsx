import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import { listAssignmentSubmissions, evaluateSubmission } from "../../services/courseService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = { "In Progress": "gray", Submitted: "orange", Evaluated: "green", Rejected: "red" };

function EvaluateModal({ submission, onClose, onSaved }) {
  const [marks, setMarks] = useState(submission.marks != null ? String(submission.marks) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [result, setResult] = useState("Pass");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await evaluateSubmission(submission.assignment_id, submission.id, {
        marks: marks !== "" ? Number(marks) : null,
        feedback: feedback.trim() || null,
        result,
      });
      onSaved();
    } catch (err) {
      setError(err.message ?? "Could not save evaluation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Evaluate — ${submission.employee?.full_name ?? "Submission"}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="dash-primary-btn cl-add-btn" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Evaluation"}
          </button>
        </>
      }
    >
      {error && <p className="rl-api-error">{error}</p>}

      <FormField label="Submission Text">
        <p style={{ whiteSpace: "pre-wrap", padding: 10, background: "var(--color-surface-alt)", borderRadius: 8 }}>
          {submission.submission_text || "No text submitted."}
        </p>
      </FormField>

      {submission.submission_file && (
        <FormField label="Submitted File">
          <a href={resolveApiAssetUrl(submission.submission_file)} target="_blank" rel="noreferrer" className="fa-outline-btn">
            <Icon name="download" size={14} /> Download
          </a>
        </FormField>
      )}

      <div className="form-row">
        <FormField label="Marks">
          <input type="number" min="0" value={marks} onChange={(e) => setMarks(e.target.value)} />
        </FormField>
        <FormField label="Result">
          <select value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </FormField>
      </div>

      <FormField label="Feedback">
        <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback for the learner..." />
      </FormField>
    </Modal>
  );
}

export default function AssignmentSubmissions() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { assignmentId } = useParams();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [evaluating, setEvaluating] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listAssignmentSubmissions(assignmentId)
      .then(setSubmissions)
      .catch((err) => setError(err.message ?? "Could not load submissions."))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

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
    { key: "started_at", header: "Started", render: (r) => (r.started_at ? String(r.started_at).slice(0, 16).replace("T", " ") : "—") },
    { key: "submitted_at", header: "Submitted", render: (r) => (r.submitted_at ? String(r.submitted_at).slice(0, 16).replace("T", " ") : "—") },
    { key: "marks", header: "Marks", render: (r) => r.marks ?? "—" },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        r.status === "Submitted" ? (
          <button type="button" className="dash-icon-btn" aria-label="Evaluate" title="Evaluate" onClick={() => setEvaluating(r)}>
            <Icon name="edit" size={15} />
          </button>
        ) : r.status === "Evaluated" || r.status === "Rejected" ? (
          <button type="button" className="dash-icon-btn" aria-label="View evaluation" title="View" onClick={() => setEvaluating(r)}>
            <Icon name="eye" size={15} />
          </button>
        ) : null
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.COURSES_ASSIGNMENTS)}>
              <Icon name="back" size={15} />
              Back to Assignments
            </button>
            <h1>Assignment Submissions</h1>
            <Breadcrumb current="Submissions" />
          </div>
        </div>

        <div className="panel cl-panel">
          {error && <p className="cl-error">{error}</p>}
          <DataTable columns={columns} rows={submissions} isLoading={loading} emptyMessage="No submissions yet." />
        </div>
      </div>

      {evaluating && (
        <EvaluateModal
          submission={evaluating}
          onClose={() => setEvaluating(null)}
          onSaved={() => {
            setEvaluating(null);
            load();
            setToast({ tone: "success", message: "Evaluation saved." });
          }}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
