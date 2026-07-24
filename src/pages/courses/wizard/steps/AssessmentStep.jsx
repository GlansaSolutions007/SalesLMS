import FormField from "../../../../components/FormField.jsx";
import RichTextEditor from "../../../../components/RichTextEditor.jsx";
import Icon from "../../../../components/Icon.jsx";
import QuestionCard from "../QuestionCard.jsx";
import { ASSESSMENT_TYPES, ASSESSMENT_STATUSES, QUESTION_TYPES } from "../courseWizardData.js";

export default function AssessmentStep({
  assessment,
  errors,
  selectedQuestionId,
  onToggleEnabled,
  onFieldChange,
  onSelectQuestion,
  onAddQuestion,
  onDeleteQuestion,
  onQuestionFieldChange,
  onOptionChange,
  onCorrectAnswerChange,
  onSaveQuestion,
  onPrevious,
  onSaveDraft,
  onNext,
  saving,
}) {
  const selectedQuestion = assessment.questions.find((q) => q.id === selectedQuestionId) ?? null;
  const questionErrors = errors.questions[selectedQuestionId] ?? {};

  return (
    <div className="cw-step-body">
      <FormField label="Enable Assessment">
        <div className="seg-group">
          <button type="button" className={`seg-chip${!assessment.enabled ? " is-active" : ""}`} onClick={() => onToggleEnabled(false)}>
            No
          </button>
          <button type="button" className={`seg-chip${assessment.enabled ? " is-active" : ""}`} onClick={() => onToggleEnabled(true)}>
            Yes
          </button>
        </div>
      </FormField>

      {!assessment.enabled ? (
        <p className="cw-step-hint">This course will not include an assessment. Toggle "Yes" above to add one.</p>
      ) : (
        <>
          <div className="form-row">
            <FormField label="Assessment Title *" error={errors.fields.title}>
              <input type="text" value={assessment.title} onChange={(e) => onFieldChange("title", e.target.value)} />
            </FormField>
            <FormField label="Assessment Code (Auto Generated)">
              <input type="text" value={assessment.code} readOnly disabled />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Assessment Type">
              <select value={assessment.type} onChange={(e) => onFieldChange("type", e.target.value)}>
                {ASSESSMENT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Duration (Minutes)" error={errors.fields.durationMinutes}>
              <input type="number" min="0" value={assessment.durationMinutes} onChange={(e) => onFieldChange("durationMinutes", e.target.value)} />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Total Marks" error={errors.fields.totalMarks}>
              <input type="number" min="0" value={assessment.totalMarks} onChange={(e) => onFieldChange("totalMarks", e.target.value)} />
            </FormField>
            <FormField label="Pass Marks" error={errors.fields.passMarks}>
              <input type="number" min="0" value={assessment.passMarks} onChange={(e) => onFieldChange("passMarks", e.target.value)} />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Maximum Attempts" error={errors.fields.maxAttempts}>
              <input type="number" min="0" value={assessment.maxAttempts} onChange={(e) => onFieldChange("maxAttempts", e.target.value)} />
            </FormField>
            <FormField label="Status">
              <div className="seg-group">
                {ASSESSMENT_STATUSES.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`seg-chip${assessment.status === opt ? " is-active" : ""}`}
                    onClick={() => onFieldChange("status", opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </FormField>
          </div>

          {errors.general && (
            <div className="cw-step-alert">
              <Icon name="warning" size={15} />
              {errors.general}
            </div>
          )}

          <div className="modules-layout">
            <div className="modules-panel">
              <div className="modules-panel-head">
                <span>Questions</span>
                <span className="modules-panel-count">{assessment.questions.length}</span>
              </div>

              <div className="modules-list">
                {assessment.questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    isActive={question.id === selectedQuestionId}
                    hasError={Boolean(errors.questions[question.id])}
                    onClick={() => onSelectQuestion(question.id)}
                    onDelete={() => onDeleteQuestion(question.id)}
                  />
                ))}
                {assessment.questions.length === 0 && <p className="modules-empty-hint">No questions yet.</p>}
              </div>

              <button type="button" className="fa-outline-btn modules-add-btn" onClick={onAddQuestion}>
                <Icon name="plus" size={15} />
                Add Question
              </button>
            </div>

            <div className="modules-detail">
              {!selectedQuestion ? (
                <div className="modules-detail-empty">
                  <Icon name="helpCircle" size={26} />
                  <p>Select a question on the left, or add a new one.</p>
                </div>
              ) : (
                <div className="question-form">
                  <FormField label="Question Type">
                    <select value={selectedQuestion.type} onChange={(e) => onQuestionFieldChange(selectedQuestion.id, "type", e.target.value)}>
                      {QUESTION_TYPES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Question *" error={questionErrors.question}>
                    <RichTextEditor
                      value={selectedQuestion.question}
                      onChange={(html) => onQuestionFieldChange(selectedQuestion.id, "question", html)}
                      placeholder="Type the question here..."
                      error={questionErrors.question}
                      minHeight={100}
                    />
                  </FormField>

                  <div className="form-row">
                    <FormField label="Marks" error={questionErrors.marks}>
                      <input type="number" min="0" value={selectedQuestion.marks} onChange={(e) => onQuestionFieldChange(selectedQuestion.id, "marks", e.target.value)} />
                    </FormField>
                    <FormField label="Sequence">
                      <input type="number" min="1" value={selectedQuestion.sequence} onChange={(e) => onQuestionFieldChange(selectedQuestion.id, "sequence", e.target.value)} />
                    </FormField>
                  </div>

                  {selectedQuestion.type === "MCQ" && (
                    <FormField label="Options" error={questionErrors.options || questionErrors.correctOptionId}>
                      <div className="option-list">
                        {selectedQuestion.options.map((opt) => (
                          <div className="option-row" key={opt.id}>
                            <span className="option-label">{opt.label}</span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => onOptionChange(selectedQuestion.id, opt.id, e.target.value)}
                              placeholder={`Option ${opt.label}`}
                            />
                            <label className="option-correct">
                              <input
                                type="radio"
                                name={`correct-${selectedQuestion.id}`}
                                checked={selectedQuestion.correctOptionId === opt.id}
                                onChange={() => onCorrectAnswerChange(selectedQuestion.id, opt.id)}
                              />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormField>
                  )}

                  {selectedQuestion.type === "True / False" && (
                    <FormField label="Select Correct Answer" error={questionErrors.correctOptionId}>
                      <div className="seg-group">
                        <button
                          type="button"
                          className={`seg-chip${selectedQuestion.correctOptionId === "true" ? " is-active" : ""}`}
                          onClick={() => onCorrectAnswerChange(selectedQuestion.id, "true")}
                        >
                          True
                        </button>
                        <button
                          type="button"
                          className={`seg-chip${selectedQuestion.correctOptionId === "false" ? " is-active" : ""}`}
                          onClick={() => onCorrectAnswerChange(selectedQuestion.id, "false")}
                        >
                          False
                        </button>
                      </div>
                    </FormField>
                  )}

                  <div className="question-form-actions">
                    <button type="button" className="cl-btn question-delete-btn" onClick={() => onDeleteQuestion(selectedQuestion.id)}>
                      <Icon name="trash" size={14} />
                      Delete Question
                    </button>
                    <button type="button" className="fa-outline-btn" onClick={() => onSaveQuestion(selectedQuestion.id)}>
                      <Icon name="check" size={14} />
                      Save Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="cw-step-footer">
        <button type="button" className="cl-btn" onClick={onPrevious} disabled={saving}>
          <Icon name="back" size={15} />
          Previous
        </button>
        <div className="cw-step-footer-right">
          <button type="button" className="cl-btn" onClick={onSaveDraft} disabled={saving}>
            <Icon name="download" size={15} style={{ transform: "rotate(90deg)" }} />
            Save Draft
          </button>
          <button type="button" className="dash-primary-btn" onClick={onNext} disabled={saving}>
            Next
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
