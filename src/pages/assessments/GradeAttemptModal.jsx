import { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import Badge from "../../components/Badge.jsx";
import { getAttempt, evaluateAttempt } from "../../services/courseService.js";

const AUTO_GRADED = ["MCQ", "True/False"];

export default function GradeAttemptModal({ assessmentId, attemptId, onClose, onSaved }) {
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marks, setMarks] = useState({}); // answerId -> string
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAttempt(assessmentId, attemptId)
      .then((data) => {
        if (cancelled) return;
        setAttempt(data);
        const initial = {};
        (data.answers ?? []).forEach((a) => {
          initial[a.id] = a.obtained_marks != null ? String(a.obtained_marks) : "";
        });
        setMarks(initial);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load this attempt.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assessmentId, attemptId]);

  const writtenAnswers = (attempt?.answers ?? []).filter((a) => !AUTO_GRADED.includes(a.question?.question_type));
  const autoAnswers = (attempt?.answers ?? []).filter((a) => AUTO_GRADED.includes(a.question?.question_type));

  async function handleSave() {
    const grades = writtenAnswers
      .filter((a) => marks[a.id] !== "" && marks[a.id] != null)
      .map((a) => ({ answer_id: a.id, obtained_marks: Number(marks[a.id]) }));

    if (grades.length === 0) {
      setSaveError("Enter marks for at least one answer.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await evaluateAttempt(assessmentId, attemptId, grades);
      onSaved();
    } catch (err) {
      setSaveError(err.message ?? "Could not save evaluation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Evaluate Attempt"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Close
          </button>
          {writtenAnswers.length > 0 && (
            <button type="button" className="dash-primary-btn cl-add-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Evaluation"}
            </button>
          )}
        </>
      }
    >
      {loading && <p className="ep-empty-note">Loading attempt…</p>}
      {error && <p className="rl-api-error">{error}</p>}

      {!loading && !error && attempt && (
        <>
          <div className="detail-grid" style={{ marginBottom: 16 }}>
            <div>
              <span>Employee</span>
              <p>{attempt.employee?.full_name}</p>
            </div>
            <div>
              <span>Current Score</span>
              <p>{attempt.score ?? "—"} {attempt.percentage != null && `(${attempt.percentage}%)`}</p>
            </div>
            <div>
              <span>Status</span>
              <p>{attempt.status}</p>
            </div>
            <div>
              <span>Result</span>
              <p>{attempt.result ?? "Pending"}</p>
            </div>
          </div>

          {autoAnswers.length > 0 && (
            <>
              <div className="rl-section-label">Auto-graded Questions</div>
              <div className="dtable-wrap" style={{ marginBottom: 16 }}>
                <table className="dtable form-doc-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Selected Answer</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {autoAnswers.map((a) => (
                      <tr key={a.id}>
                        <td>{a.question?.question}</td>
                        <td>{a.selected_option?.option_text ?? "—"}</td>
                        <td>
                          {a.is_correct == null ? "—" : <Badge tone={a.is_correct ? "green" : "red"}>{a.is_correct ? "Correct" : "Incorrect"}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {writtenAnswers.length > 0 ? (
            <>
              <div className="rl-section-label">Written Answers — Enter Marks</div>
              {saveError && <p className="rl-api-error">{saveError}</p>}
              <div className="dtable-wrap">
                <table className="dtable form-doc-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Answer</th>
                      <th>Max Marks</th>
                      <th>Marks Awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {writtenAnswers.map((a) => (
                      <tr key={a.id}>
                        <td>{a.question?.question}</td>
                        <td style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>{a.answer_text || "—"}</td>
                        <td>{a.question?.marks}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={a.question?.marks}
                            step="0.5"
                            className="form-doc-input"
                            value={marks[a.id] ?? ""}
                            onChange={(e) => setMarks((m) => ({ ...m, [a.id]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="ep-empty-note">No written answers requiring manual evaluation — this attempt was auto-graded.</p>
          )}
        </>
      )}
    </Modal>
  );
}
