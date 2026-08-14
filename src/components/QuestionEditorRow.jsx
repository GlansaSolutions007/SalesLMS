import FormField from "./FormField.jsx";
import Icon from "./Icon.jsx";

// One question in a compact inline question editor — MCQ / True-False /
// Short Answer / Essay authoring, same option-list/option-row/seg-group CSS
// as QuestionCard.jsx + AssessmentStep.jsx's split-panel question form,
// just inline rather than a separate select-then-edit-in-a-detail-pane
// layout. Shared by the Course Wizard's lesson-level Assessment (LessonCard.jsx,
// which passes a narrower allowedTypes) and the standalone Assessments
// admin page (AssessmentsList.jsx, which allows all four types).
export default function QuestionEditorRow({ question, index, error, allowedTypes, onFieldChange, onOptionChange, onCorrectAnswerChange, onRemove }) {
  return (
    <div className="lesson-question-row">
      <div className="lesson-question-row-head">
        <span>Question {index + 1}</span>
        <select value={question.type} onChange={(e) => onFieldChange("type", e.target.value)}>
          {allowedTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={onRemove} aria-label="Remove question" title="Remove question">
          <Icon name="trash" size={13} />
        </button>
      </div>

      <FormField label="Question *" error={error?.question}>
        <textarea rows={2} value={question.question} onChange={(e) => onFieldChange("question", e.target.value)} placeholder="Type the question here..." />
      </FormField>

      {question.type === "MCQ" && (
        <FormField label="Options" error={error?.options || error?.correctOptionId}>
          <div className="option-list">
            {question.options.map((opt) => (
              <div className="option-row" key={opt.id}>
                <span className="option-label">{opt.label}</span>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => onOptionChange(opt.id, e.target.value)}
                  placeholder={`Option ${opt.label}`}
                />
                <label className="option-correct">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctOptionId === opt.id}
                    onChange={() => onCorrectAnswerChange(opt.id)}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>
        </FormField>
      )}

      {question.type === "True/False" && (
        <FormField label="Select Correct Answer" error={error?.correctOptionId}>
          <div className="seg-group">
            <button type="button" className={`seg-chip${question.correctOptionId === "true" ? " is-active" : ""}`} onClick={() => onCorrectAnswerChange("true")}>
              True
            </button>
            <button type="button" className={`seg-chip${question.correctOptionId === "false" ? " is-active" : ""}`} onClick={() => onCorrectAnswerChange("false")}>
              False
            </button>
          </div>
        </FormField>
      )}

      <FormField label="Marks" error={error?.marks}>
        <input type="number" min="0" value={question.marks} onChange={(e) => onFieldChange("marks", e.target.value)} />
      </FormField>
    </div>
  );
}
