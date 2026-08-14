import FormField from "../../../components/FormField.jsx";
import LessonTypeFields from "../../../components/LessonTypeFields.jsx";
import QuestionEditorRow from "../../../components/QuestionEditorRow.jsx";
import BulkQuestionImport from "../../../components/BulkQuestionImport.jsx";
import Icon from "../../../components/Icon.jsx";
import { LESSON_QUESTION_TYPES, ASSESSMENT_TYPES, ASSESSMENT_STATUSES } from "./courseWizardData.js";

export default function LessonCard({
  lesson,
  index,
  errors,
  onChange,
  onDelete,
  onAddAssessmentQuestion,
  onBulkImportAssessmentQuestions,
  onDeleteAssessmentQuestion,
  onAssessmentQuestionFieldChange,
  onAssessmentOptionChange,
  onAssessmentCorrectAnswerChange,
}) {
  return (
    <div className="lesson-card">
      <div className="lesson-card-head">
        <span className="lesson-card-index">
          <Icon name="play" size={13} />
          Lesson {index + 1}
        </span>
        <button type="button" className="cl-btn lesson-card-delete" onClick={onDelete}>
          <Icon name="trash" size={14} />
          Delete Lesson
        </button>
      </div>

      <FormField label="Lesson Title *" error={errors.title}>
        <input type="text" value={lesson.title} onChange={(e) => onChange("title", e.target.value)} placeholder="e.g. Why Customers Buy" />
      </FormField>

      <FormField label="Lesson Duration">
        <input type="text" value={lesson.duration} onChange={(e) => onChange("duration", e.target.value)} placeholder="e.g. 12m" />
      </FormField>

      <LessonTypeFields
        lessonType={lesson.type}
        onLessonTypeChange={(v) => onChange("type", v)}
        description={lesson.description}
        onDescriptionChange={(html) => onChange("description", html)}
        descriptionError={errors.description}
        videoSource={lesson.videoSource}
        onVideoSourceChange={(v) => onChange("videoSource", v)}
        videoUrl={lesson.videoUrl}
        onVideoUrlChange={(v) => onChange("videoUrl", v)}
        videoUrlError={errors.videoUrl}
        videoFileName={lesson.videoFileName}
        videoFileUrl={lesson.videoFileUrl}
        videoFileError={errors.videoFilePath}
        onVideoFileUploaded={({ path, name, url }) => {
          onChange("videoFilePath", path);
          onChange("videoFileName", name);
          onChange("videoFileUrl", url);
        }}
        onVideoFileCleared={() => {
          onChange("videoFilePath", "");
          onChange("videoFileName", "");
          onChange("videoFileUrl", "");
        }}
        pdfFileName={lesson.pdfFileName}
        pdfFileUrl={lesson.pdfFileUrl}
        pdfFileError={errors.pdfFilePath}
        onPdfFileUploaded={({ path, name, url }) => {
          onChange("pdfFilePath", path);
          onChange("pdfFileName", name);
          onChange("pdfFileUrl", url);
        }}
        onPdfFileCleared={() => {
          onChange("pdfFilePath", "");
          onChange("pdfFileName", "");
          onChange("pdfFileUrl", "");
        }}
      />

      {/* "Resources" section hidden per request — lesson.resources / the
          onAddResource/onResourceChange/onResourceRemove handlers are still
          wired in CourseWizard.jsx, just not rendered here anymore. */}

      {/* "Add an assignment to this lesson" removed per request — the
          lesson.assignment* fields/handlers are still wired in
          CourseWizard.jsx (create/update/delete on save), just not
          rendered here anymore. Lesson-level Assessment (below) remains. */}

      <div className="lesson-assignment">
        <label className="lesson-assignment-toggle">
          <input
            type="checkbox"
            checked={lesson.assessmentEnabled}
            onChange={(e) => onChange("assessmentEnabled", e.target.checked)}
          />
          <span>Add an assessment to this lesson</span>
        </label>

        {lesson.assessmentEnabled && (
          <div className="lesson-assignment-fields">
            <FormField label="Assessment Title *" error={errors.assessmentTitle}>
              <input
                type="text"
                value={lesson.assessmentTitle}
                onChange={(e) => onChange("assessmentTitle", e.target.value)}
                placeholder="e.g. Quick Knowledge Check"
              />
            </FormField>
            <div className="form-row">
              <FormField label="Assessment Type">
                <select value={lesson.assessmentType} onChange={(e) => onChange("assessmentType", e.target.value)}>
                  {ASSESSMENT_TYPES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <div className="seg-group">
                  {ASSESSMENT_STATUSES.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      className={`seg-chip${lesson.assessmentStatus === opt ? " is-active" : ""}`}
                      onClick={() => onChange("assessmentStatus", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Duration (Minutes)">
                <input
                  type="number"
                  min="0"
                  value={lesson.assessmentDurationMinutes}
                  onChange={(e) => onChange("assessmentDurationMinutes", e.target.value)}
                />
              </FormField>
              <FormField label="Pass Marks">
                <input
                  type="number"
                  min="0"
                  value={lesson.assessmentPassMarks}
                  onChange={(e) => onChange("assessmentPassMarks", e.target.value)}
                />
              </FormField>
            </div>

            {errors.assessmentGeneral && (
              <div className="cw-step-alert">
                <Icon name="warning" size={15} />
                {errors.assessmentGeneral}
              </div>
            )}

            <div className="lesson-question-list">
              {lesson.assessmentQuestions.map((question, qIndex) => (
                <QuestionEditorRow
                  key={question.id}
                  question={question}
                  index={qIndex}
                  allowedTypes={LESSON_QUESTION_TYPES}
                  error={errors.assessmentQuestions?.[question.id]}
                  onFieldChange={(field, value) => onAssessmentQuestionFieldChange(question.id, field, value)}
                  onOptionChange={(optionId, text) => onAssessmentOptionChange(question.id, optionId, text)}
                  onCorrectAnswerChange={(optionId) => onAssessmentCorrectAnswerChange(question.id, optionId)}
                  onRemove={() => onDeleteAssessmentQuestion(question.id)}
                />
              ))}
            </div>

            <div className="modules-add-actions">
              <button type="button" className="fa-outline-btn lesson-add-resource-btn" onClick={onAddAssessmentQuestion}>
                <Icon name="plus" size={13} />
                Add Question
              </button>
              <BulkQuestionImport
                allowedTypes={LESSON_QUESTION_TYPES}
                questionCount={lesson.assessmentQuestions.length}
                onImport={onBulkImportAssessmentQuestions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
