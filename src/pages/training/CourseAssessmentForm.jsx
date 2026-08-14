import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import QuestionEditorRow from "../../components/QuestionEditorRow.jsx";
import BulkQuestionImport from "../../components/BulkQuestionImport.jsx";
import QuestionCard from "../courses/wizard/QuestionCard.jsx";
import "./training.css";
import "../courses/wizard/CourseWizard.css";
import {
  getCourse,
  listModules,
  listLessons,
  getAssessment,
  createAssessment,
  updateAssessment,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../services/courseService.js";
import { ASSESSMENT_TYPES, LESSON_QUESTION_TYPES, OPTION_LABELS, emptyQuestion } from "../courses/wizard/courseWizardData.js";
import { validateQuestion } from "../courses/wizard/courseWizardValidation.js";
import { buildQuestionPayload } from "../../utils/questionPayload.js";
import { ROUTES } from "../../router/routePaths.js";

const EMPTY_FORM = {
  assessment_title: "",
  assessment_type: ASSESSMENT_TYPES[0],
  module_id: "",
  lesson_id: "",
  duration_minutes: "",
  pass_marks: "",
};

// Same mapping used by CourseAssessments.jsx — kept local here since it's
// only needed where a persisted question is loaded back into edit state.
function mapQuestionFromApi(q) {
  const options = (q.options ?? []).map((o, i) => ({
    id: `opt-${o.id}`,
    apiId: o.id,
    label: OPTION_LABELS[i] ?? String(i + 1),
    text: o.option_text,
  }));
  const correct = (q.options ?? []).find((o) => o.is_correct);
  let correctOptionId = "";
  if (q.question_type === "True/False") {
    correctOptionId = correct?.option_text === "True" ? "true" : correct?.option_text === "False" ? "false" : "";
  } else if (correct) {
    correctOptionId = `opt-${correct.id}`;
  }
  return {
    id: `q-${q.id}`,
    apiId: q.id,
    type: q.question_type,
    question: q.question,
    marks: q.marks != null ? String(q.marks) : "",
    options,
    correctOptionId,
  };
}

export default function CourseAssessmentForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { id: assessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(assessmentId);

  const [courseId, setCourseId] = useState(isEdit ? "" : searchParams.get("course_id") ?? "");
  const [course, setCourse] = useState(null);

  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [questionErrors, setQuestionErrors] = useState({});
  const deletedQuestionApiIds = useRef([]);

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAssessment(assessmentId)
      .then((data) => {
        setCourseId(String(data.course_id));
        setForm({
          assessment_title: data.assessment_title,
          assessment_type: data.assessment_type ?? ASSESSMENT_TYPES[0],
          module_id: data.module_id ? String(data.module_id) : "",
          lesson_id: data.lesson_id ? String(data.lesson_id) : "",
          duration_minutes: data.duration_minutes != null ? String(data.duration_minutes) : "",
          pass_marks: data.pass_marks != null ? String(data.pass_marks) : "",
        });
        const mapped = (data.questions ?? []).map(mapQuestionFromApi);
        setQuestions(mapped);
        setSelectedQuestionId(mapped[0]?.id ?? null);
      })
      .catch((err) => setLoadError(err.message ?? "Could not load this assessment."))
      .finally(() => setLoading(false));
  }, [isEdit, assessmentId]);

  useEffect(() => {
    if (!courseId) return;
    getCourse(courseId).then(setCourse).catch(() => setCourse(null));
    listModules(courseId).then(setModules).catch(() => setModules([]));
  }, [courseId]);

  useEffect(() => {
    if (!courseId || !form.module_id) { setLessons([]); return; }
    setLessonsLoading(true);
    listLessons(courseId, form.module_id)
      .then(setLessons)
      .catch(() => setLessons([]))
      .finally(() => setLessonsLoading(false));
  }, [courseId, form.module_id]);

  function addQuestion() {
    const question = emptyQuestion(questions.length + 1);
    setQuestions((qs) => [...qs, question]);
    setSelectedQuestionId(question.id);
  }

  function bulkImportQuestions(newQuestions) {
    if (!newQuestions.length) return;
    setQuestions((qs) => [...qs, ...newQuestions]);
    setSelectedQuestionId(newQuestions[0].id);
    setToast({ tone: "success", message: `${newQuestions.length} question(s) imported.` });
  }

  function updateQuestionField(questionId, field, value) {
    setQuestions((qs) => qs.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)));
  }

  function updateQuestionOption(questionId, optionId, text) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === questionId ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)) } : q))
    );
  }

  function updateQuestionCorrectAnswer(questionId, optionId) {
    setQuestions((qs) => qs.map((q) => (q.id === questionId ? { ...q, correctOptionId: optionId } : q)));
  }

  function removeQuestion(questionId) {
    const target = questions.find((q) => q.id === questionId);
    if (target?.apiId) deletedQuestionApiIds.current.push(target.apiId);
    setQuestions((qs) => {
      const next = qs.filter((q) => q.id !== questionId);
      if (selectedQuestionId === questionId) setSelectedQuestionId(next[0]?.id ?? null);
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();

    const nextFormErrors = {};
    if (!form.assessment_title.trim()) nextFormErrors.assessment_title = "Assessment title is required.";
    setFormErrors(nextFormErrors);

    const nextQuestionErrors = {};
    questions.forEach((q) => {
      const qErrors = validateQuestion(q);
      if (Object.keys(qErrors).length) nextQuestionErrors[q.id] = qErrors;
    });
    setQuestionErrors(nextQuestionErrors);

    if (Object.keys(nextFormErrors).length || Object.keys(nextQuestionErrors).length) {
      if (Object.keys(nextQuestionErrors).length) setSelectedQuestionId(Object.keys(nextQuestionErrors)[0]);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        assessment_title: form.assessment_title.trim(),
        assessment_type: form.assessment_type,
        course_id: courseId,
        module_id: form.module_id || null,
        lesson_id: form.lesson_id || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        pass_marks: form.pass_marks ? Number(form.pass_marks) : null,
      };

      let savedId = assessmentId;
      if (isEdit) {
        await updateAssessment(assessmentId, payload);
      } else {
        const created = await createAssessment(payload);
        savedId = created.id;
      }

      await Promise.all(deletedQuestionApiIds.current.map((qApiId) => deleteQuestion(savedId, qApiId)));
      deletedQuestionApiIds.current = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qPayload = buildQuestionPayload(q, i);
        if (q.apiId) {
          await updateQuestion(savedId, q.apiId, qPayload);
        } else {
          await createQuestion(savedId, qPayload);
        }
      }

      navigate(ROUTES.COURSES_ASSESSMENTS);
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not save this assessment." });
    } finally {
      setSaving(false);
    }
  }

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) ?? null;
  const selectedIndex = questions.findIndex((q) => q.id === selectedQuestionId);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cas-header">
          <div className="cas-header-title">
            <span className="cas-header-icon">
              <Icon name="clipboard" size={22} />
            </span>
            <div className="cas-header-text">
              <h1>{isEdit ? "Edit Assessment" : "Add Assessment"}</h1>
              <Breadcrumb current={isEdit ? "Edit Assessment" : "Add Assessment"} />
              {course && (
                <span className="cas-course-chip">
                  <Icon name="book" size={12} />
                  {course.course_name}
                </span>
              )}
            </div>
          </div>
          <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COURSES_ASSESSMENTS)}>
            <Icon name="back" size={14} />
            Back to Assessments
          </button>
        </div>

        {loading ? (
          <div className="panel cw-panel"><p className="cl-muted">Loading…</p></div>
        ) : loadError ? (
          <div className="panel cw-panel cl-error">{loadError}</div>
        ) : !courseId ? (
          <div className="panel cw-panel cl-error">No course selected. Go back and choose a course first.</div>
        ) : (
          <form onSubmit={handleSave} className="cas-form">
            <div className="panel cw-panel cas-section">
              <h2 className="cas-section-title">
                <span className="cas-section-icon"><Icon name="edit" size={14} /></span>
                Assessment Details
              </h2>

              <FormField label="Assessment Title *" error={formErrors.assessment_title}>
                <input
                  type="text"
                  value={form.assessment_title}
                  onChange={(e) => setForm((f) => ({ ...f, assessment_title: e.target.value }))}
                  placeholder="e.g. Module 1 Quiz"
                />
              </FormField>

              <div className="form-row">
                {/* <FormField label="Type">
                  <select value={form.assessment_type} onChange={(e) => setForm((f) => ({ ...f, assessment_type: e.target.value }))}>
                    {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField> */}
                <FormField label="Duration (Minutes)">
                  <input type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
                </FormField>

                 <FormField label="Pass Marks">
                <input type="number" min="0" value={form.pass_marks} onChange={(e) => setForm((f) => ({ ...f, pass_marks: e.target.value }))} />
              </FormField>

              </div>

             
              <div className="form-row">
                <FormField label="Module (optional — leave blank for whole-course)">
                  <select
                    value={form.module_id}
                    onChange={(e) => setForm((f) => ({ ...f, module_id: e.target.value, lesson_id: "" }))}
                  >
                    <option value="">Whole course</option>
                    {modules.map((m) => <option key={m.id} value={m.id}>{m.module_name}</option>)}
                  </select>
                </FormField>
                <FormField label="Lesson (optional — attach to one lesson instead)">
                  <select
                    value={form.lesson_id}
                    disabled={!form.module_id || lessonsLoading}
                    onChange={(e) => setForm((f) => ({ ...f, lesson_id: e.target.value }))}
                  >
                    <option value="">{form.module_id ? "Whole module" : "Select a module first"}</option>
                    {lessons.map((l) => <option key={l.id} value={l.id}>{l.lesson_title}</option>)}
                  </select>
                </FormField>
              </div>
            </div>

            <div className="panel cw-panel cas-section">
              <h2 className="cas-section-title">
                <span className="cas-section-icon"><Icon name="clipboard" size={14} /></span>
                Questions
                <span className="modules-panel-count">{questions.length}</span>
              </h2>
              <p className="cw-step-hint cas-question-hint">Only Multiple Choice and True / False question types are supported here.</p>

              <div className="modules-layout">
                <div className="modules-panel">
                  <div className="modules-list">
                    {questions.map((question, qIndex) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={qIndex}
                        isActive={question.id === selectedQuestionId}
                        hasError={Boolean(questionErrors[question.id])}
                        onClick={() => setSelectedQuestionId(question.id)}
                        onDelete={() => removeQuestion(question.id)}
                      />
                    ))}
                    {questions.length === 0 && <p className="modules-empty-hint">No questions yet.</p>}
                  </div>

                  <div className="modules-add-actions">
                    <button type="button" className="fa-outline-btn modules-add-btn" onClick={addQuestion}>
                      <Icon name="plus" size={15} />
                      Add Question
                    </button>
                    <BulkQuestionImport allowedTypes={LESSON_QUESTION_TYPES} questionCount={questions.length} onImport={bulkImportQuestions} />
                  </div>
                </div>

                <div className="modules-detail">
                  {!selectedQuestion ? (
                    <div className="modules-detail-empty">
                      <Icon name="helpCircle" size={26} />
                      <p>Select a question on the left, or add a new one.</p>
                    </div>
                  ) : (
                    <QuestionEditorRow
                      question={selectedQuestion}
                      index={selectedIndex}
                      allowedTypes={LESSON_QUESTION_TYPES}
                      error={questionErrors[selectedQuestion.id]}
                      onFieldChange={(field, value) => updateQuestionField(selectedQuestion.id, field, value)}
                      onOptionChange={(optionId, text) => updateQuestionOption(selectedQuestion.id, optionId, text)}
                      onCorrectAnswerChange={(optionId) => updateQuestionCorrectAnswer(selectedQuestion.id, optionId)}
                      onRemove={() => removeQuestion(selectedQuestion.id)}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="cw-step-footer">
              <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COURSES_ASSESSMENTS)} disabled={saving}>Cancel</button>
              <div className="cw-step-footer-right">
                <button type="submit" className="dash-primary-btn cl-add-btn" disabled={saving}>
                  {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Assessment"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
