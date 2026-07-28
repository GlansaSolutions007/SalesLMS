import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../../components/Topbar.jsx";
import Icon from "../../../components/Icon.jsx";
import Modal from "../../../components/Modal.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import Toast from "../../../components/Toast.jsx";
import CourseStepper from "./CourseStepper.jsx";
import PublishSummary from "./PublishSummary.jsx";
import CourseDetailsStep from "./steps/CourseDetailsStep.jsx";
import ModulesLessonsStep from "./steps/ModulesLessonsStep.jsx";
import AssessmentStep from "./steps/AssessmentStep.jsx";
import PublishStep from "./steps/PublishStep.jsx";
import {
  DIFFICULTY_LEVELS,
  ASSESSMENT_TYPES,
  generateCourseCode,
  generateAssessmentCode,
  emptyModule,
  emptyLesson,
  emptyResource,
  emptyQuestion,
} from "./courseWizardData.js";
import { validateCourseDetails, validateModulesStep, validateAssessmentStep, validatePublishConfirmation, stepHasErrors } from "./courseWizardValidation.js";
import {
  fetchCategories,
  createCourse,
  updateCourse,
  createModule,
  updateModule,
  deleteModule as deleteModuleApi,
  createLesson,
  updateLesson,
  deleteLesson as deleteLessonApi,
  createAssessment,
  updateAssessment,
  createQuestion,
  updateQuestion,
  deleteQuestion as deleteQuestionApi,
} from "../../../services/courseService.js";
import { ROUTES } from "../../../router/routePaths.js";
import "./CourseWizard.css";

const STEPS = [
  { key: "details", label: "Course Details" },
  { key: "modules", label: "Modules & Lessons" },
  { key: "assessment", label: "Assessment" },
  { key: "publish", label: "Publish" },
];

function buildInitialState() {
  return {
    details: {
      thumbnail: "",
      thumbnailFile: null,
      category: "",
      code: generateCourseCode(),
      name: "",
      description: "",
      difficulty: DIFFICULTY_LEVELS[0],
      durationHours: "",
      durationMinutes: "",
      estimatedDays: "",
      status: "Draft",
    },
    modules: [],
    assessment: {
      enabled: false,
      title: "",
      code: generateAssessmentCode(),
      type: ASSESSMENT_TYPES[0],
      durationMinutes: "",
      totalMarks: "",
      passMarks: "",
      maxAttempts: "",
      status: "Draft",
      questions: [],
    },
    publish: {
      visibility: "Company Only",
      status: "Draft",
      publishDateMode: "Immediately",
      scheduledDate: "",
      certificate: true,
      allowEnrollment: true,
      showInLms: true,
      confirmed: false,
    },
  };
}

function mapModules(modules, moduleId, fn) {
  return modules.map((m) => (m.id === moduleId ? fn(m) : m));
}

function mapLessons(module, lessonId, fn) {
  return { ...module, lessons: module.lessons.map((l) => (l.id === lessonId ? fn(l) : l)) };
}

function findModuleIdByLessonId(modules, lessonId) {
  return modules.find((m) => m.lessons.some((l) => l.id === lessonId))?.id ?? null;
}

function buildCourseFormData(course, targetStatus) {
  const fd = new FormData();
  fd.append("course_name", course.details.name);
  if (course.details.category) fd.append("category_id", course.details.category);
  fd.append("course_code", course.details.code);
  if (course.details.description) fd.append("description", course.details.description);
  if (course.details.difficulty) fd.append("difficulty_level", course.details.difficulty);

  const h = Number(course.details.durationHours) || 0;
  const m = Number(course.details.durationMinutes) || 0;
  if (h || m) fd.append("duration_hours", (h + m / 60).toFixed(2));

  fd.append("status", targetStatus ?? course.details.status ?? "Draft");

  if (course.details.thumbnailFile instanceof File) {
    fd.append("thumbnail", course.details.thumbnailFile);
  }
  return fd;
}

function buildModulePayload(module, index) {
  return {
    module_name: module.name,
    description: module.description || null,
    estimated_duration: module.estimatedDuration ? Number(module.estimatedDuration) : null,
    sequence_no: index + 1,
  };
}

function buildLessonPayload(lesson, index) {
  return {
    lesson_title: lesson.title,
    lesson_description: lesson.description || null,
    lesson_type: lesson.type || null,
    duration_minutes: lesson.duration ? Number(lesson.duration) : null,
    sequence_no: index + 1,
  };
}

function buildAssessmentPayload(assessment, courseId) {
  return {
    assessment_title: assessment.title,
    assessment_code: assessment.code,
    assessment_type: assessment.type,
    course_id: courseId,
    duration_minutes: assessment.durationMinutes ? Number(assessment.durationMinutes) : null,
    pass_marks: assessment.passMarks ? Number(assessment.passMarks) : 0,
    max_attempts: assessment.maxAttempts ? Number(assessment.maxAttempts) : 1,
    status: assessment.status ?? "Draft",
  };
}

function buildQuestionPayload(question, index) {
  const options = [];
  if (question.type === "MCQ") {
    question.options.forEach((opt, i) => {
      if (opt.text.trim()) {
        options.push({ option_text: opt.text, is_correct: opt.id === question.correctOptionId, sequence_no: i + 1 });
      }
    });
  } else if (question.type === "True / False") {
    options.push({ option_text: "True", is_correct: question.correctOptionId === "true", sequence_no: 1 });
    options.push({ option_text: "False", is_correct: question.correctOptionId === "false", sequence_no: 2 });
  }
  return {
    question_type: question.type,
    question: question.question,
    marks: question.marks ? Number(question.marks) : 1,
    sequence_no: index + 1,
    options,
  };
}

export default function CourseWizard() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [course, setCourse] = useState(buildInitialState);
  const [courseId, setCourseId] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [detailsErrors, setDetailsErrors] = useState({});
  const [moduleStepErrors, setModuleStepErrors] = useState({ general: null, modules: {}, lessons: {} });
  const [assessmentStepErrors, setAssessmentStepErrors] = useState({ general: null, fields: {}, questions: {} });
  const [publishErrors, setPublishErrors] = useState({ confirmed: null });

  // Tracks items deleted from UI that were already persisted to the API
  const pendingDeletes = useRef({ modules: [], lessons: [], questions: [] });
  // Mirror of course state for synchronous reads before state updates
  const courseRef = useRef(course);
  useEffect(() => { courseRef.current = course; }, [course]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const effectiveModuleId = selectedModuleId ?? course.modules[0]?.id ?? null;
  const effectiveQuestionId = selectedQuestionId ?? course.assessment.questions[0]?.id ?? null;

  function updateDetails(field, value) {
    setDirty(true);
    setCourse((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }));
    setDetailsErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function updateThumbnail(dataUrl, file) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      details: { ...prev.details, thumbnail: dataUrl ?? "", thumbnailFile: file ?? null },
    }));
  }

  function addModule() {
    setDirty(true);
    const module = emptyModule(course.modules.length + 1);
    setCourse((prev) => ({ ...prev, modules: [...prev.modules, module] }));
    setSelectedModuleId(module.id);
  }

  function deleteModule(moduleId) {
    setDirty(true);
    const module = courseRef.current.modules.find((m) => m.id === moduleId);
    if (module?.apiId) {
      pendingDeletes.current.modules.push({ moduleApiId: module.apiId });
    }
    setCourse((prev) => {
      const nextModules = prev.modules.filter((m) => m.id !== moduleId);
      if (effectiveModuleId === moduleId) setSelectedModuleId(nextModules[0]?.id ?? null);
      return { ...prev, modules: nextModules };
    });
  }

  function updateModuleField(moduleId, field, value) {
    setDirty(true);
    setCourse((prev) => ({ ...prev, modules: mapModules(prev.modules, moduleId, (m) => ({ ...m, [field]: value })) }));
    setModuleStepErrors((prev) => {
      if (!prev.modules[moduleId]) return prev;
      const next = { ...prev, modules: { ...prev.modules } };
      delete next.modules[moduleId];
      return next;
    });
  }

  function addLesson(moduleId) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      modules: mapModules(prev.modules, moduleId, (m) => ({ ...m, lessons: [...m.lessons, emptyLesson(m.lessons.length + 1)] })),
    }));
  }

  function deleteLesson(moduleId, lessonId) {
    setDirty(true);
    const module = courseRef.current.modules.find((m) => m.id === moduleId);
    const lesson = module?.lessons.find((l) => l.id === lessonId);
    if (lesson?.apiId && module?.apiId) {
      pendingDeletes.current.lessons.push({ moduleApiId: module.apiId, lessonApiId: lesson.apiId });
    }
    setCourse((prev) => ({
      ...prev,
      modules: mapModules(prev.modules, moduleId, (m) => ({ ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) })),
    }));
  }

  function updateLessonField(moduleId, lessonId, field, value) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      modules: mapModules(prev.modules, moduleId, (m) => mapLessons(m, lessonId, (l) => ({ ...l, [field]: value }))),
    }));
    setModuleStepErrors((prev) => {
      if (!prev.lessons[lessonId]) return prev;
      const next = { ...prev, lessons: { ...prev.lessons } };
      delete next.lessons[lessonId];
      return next;
    });
  }

  function addResource(moduleId, lessonId) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      modules: mapModules(prev.modules, moduleId, (m) =>
        mapLessons(m, lessonId, (l) => ({ ...l, resources: [...l.resources, emptyResource()] }))
      ),
    }));
  }

  function updateResourceField(moduleId, lessonId, resourceId, field, value) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      modules: mapModules(prev.modules, moduleId, (m) =>
        mapLessons(m, lessonId, (l) => ({ ...l, resources: l.resources.map((r) => (r.id === resourceId ? { ...r, [field]: value } : r)) }))
      ),
    }));
  }

  function removeResource(moduleId, lessonId, resourceId) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      modules: mapModules(prev.modules, moduleId, (m) =>
        mapLessons(m, lessonId, (l) => ({ ...l, resources: l.resources.filter((r) => r.id !== resourceId) }))
      ),
    }));
  }

  function toggleAssessmentEnabled(enabled) {
    setDirty(true);
    setCourse((prev) => ({ ...prev, assessment: { ...prev.assessment, enabled } }));
  }

  function updateAssessmentField(field, value) {
    setDirty(true);
    setCourse((prev) => ({ ...prev, assessment: { ...prev.assessment, [field]: value } }));
    setAssessmentStepErrors((prev) => {
      if (!prev.fields[field]) return prev;
      const next = { ...prev, fields: { ...prev.fields } };
      delete next.fields[field];
      return next;
    });
  }

  function addQuestion() {
    setDirty(true);
    const question = emptyQuestion(course.assessment.questions.length + 1);
    setCourse((prev) => ({ ...prev, assessment: { ...prev.assessment, questions: [...prev.assessment.questions, question] } }));
    setSelectedQuestionId(question.id);
  }

  function deleteQuestion(questionId) {
    setDirty(true);
    const question = courseRef.current.assessment.questions.find((q) => q.id === questionId);
    if (question?.apiId && assessmentId) {
      pendingDeletes.current.questions.push({ assessmentApiId: assessmentId, questionApiId: question.apiId });
    }
    setCourse((prev) => {
      const nextQuestions = prev.assessment.questions.filter((q) => q.id !== questionId);
      if (effectiveQuestionId === questionId) setSelectedQuestionId(nextQuestions[0]?.id ?? null);
      return { ...prev, assessment: { ...prev.assessment, questions: nextQuestions } };
    });
  }

  function updateQuestionField(questionId, field, value) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        questions: prev.assessment.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
      },
    }));
    setAssessmentStepErrors((prev) => {
      if (!prev.questions[questionId]) return prev;
      const next = { ...prev, questions: { ...prev.questions } };
      delete next.questions[questionId];
      return next;
    });
  }

  function updateOption(questionId, optionId, text) {
    setDirty(true);
    setCourse((prev) => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        questions: prev.assessment.questions.map((q) =>
          q.id === questionId ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)) } : q
        ),
      },
    }));
  }

  function updateCorrectAnswer(questionId, optionId) {
    setDirty(true);
    updateQuestionField(questionId, "correctOptionId", optionId);
  }

  function saveQuestion() {
    setToast({ tone: "success", message: "Question saved." });
  }

  function updatePublishField(field, value) {
    setDirty(true);
    setCourse((prev) => ({ ...prev, publish: { ...prev.publish, [field]: value } }));
    if (field === "confirmed") setPublishErrors({ confirmed: null });
  }

  // ── API persistence ──────────────────────────────────────────────────────────

  async function persistAll(targetStatus) {
    setSaving(true);
    try {
      const snap = courseRef.current;

      // 1. Save course
      const formData = buildCourseFormData(snap, targetStatus);
      let cid = courseId;
      if (!cid) {
        const created = await createCourse(formData);
        cid = created.id;
        setCourseId(cid);
      } else {
        await updateCourse(cid, formData);
      }

      // 2. Process pending module deletes
      await Promise.allSettled(
        pendingDeletes.current.modules.map(({ moduleApiId }) => deleteModuleApi(cid, moduleApiId))
      );
      pendingDeletes.current.modules = [];

      // 3. Sync modules (sequential to preserve order)
      const updatedModules = [];
      for (let mIdx = 0; mIdx < snap.modules.length; mIdx++) {
        const module = snap.modules[mIdx];
        const modPayload = buildModulePayload(module, mIdx);
        let modApiId = module.apiId;
        if (!modApiId) {
          const created = await createModule(cid, modPayload);
          modApiId = created.id;
        } else {
          await updateModule(cid, modApiId, modPayload);
        }

        // Pending lesson deletes for this module
        const lessonDeletes = pendingDeletes.current.lessons.filter((l) => l.moduleApiId === modApiId);
        await Promise.allSettled(lessonDeletes.map(({ lessonApiId }) => deleteLessonApi(cid, modApiId, lessonApiId)));
        pendingDeletes.current.lessons = pendingDeletes.current.lessons.filter((l) => l.moduleApiId !== modApiId);

        // Sync lessons
        const updatedLessons = [];
        for (let lIdx = 0; lIdx < module.lessons.length; lIdx++) {
          const lesson = module.lessons[lIdx];
          const lesPayload = buildLessonPayload(lesson, lIdx);
          let lesApiId = lesson.apiId;
          if (!lesApiId) {
            const created = await createLesson(cid, modApiId, lesPayload);
            lesApiId = created.id;
          } else {
            await updateLesson(cid, modApiId, lesApiId, lesPayload);
          }
          updatedLessons.push({ ...lesson, apiId: lesApiId });
        }

        updatedModules.push({ ...module, apiId: modApiId, lessons: updatedLessons });
      }

      // 4. Sync assessment
      let updatedAssessment = snap.assessment;
      let asmId = assessmentId;
      if (snap.assessment.enabled) {
        const asmPayload = buildAssessmentPayload(snap.assessment, cid);
        if (!asmId) {
          const created = await createAssessment(asmPayload);
          asmId = created.id;
          setAssessmentId(asmId);
        } else {
          await updateAssessment(asmId, asmPayload);
        }

        // Pending question deletes
        await Promise.allSettled(
          pendingDeletes.current.questions.map(({ questionApiId }) => deleteQuestionApi(asmId, questionApiId))
        );
        pendingDeletes.current.questions = [];

        // Sync questions
        const updatedQuestions = [];
        for (let qIdx = 0; qIdx < snap.assessment.questions.length; qIdx++) {
          const q = snap.assessment.questions[qIdx];
          const qPayload = buildQuestionPayload(q, qIdx);
          let qApiId = q.apiId;
          if (!qApiId) {
            const created = await createQuestion(asmId, qPayload);
            qApiId = created.id;
          } else {
            await updateQuestion(asmId, qApiId, qPayload);
          }
          updatedQuestions.push({ ...q, apiId: qApiId });
        }
        updatedAssessment = { ...snap.assessment, questions: updatedQuestions };
      }

      // 5. Commit API IDs back to state
      setCourse((prev) => ({
        ...prev,
        modules: updatedModules,
        assessment: updatedAssessment,
      }));

      setSaving(false);
      setDirty(false);
      return cid;
    } catch (err) {
      setSaving(false);
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setToast({ tone: "error", message: msg });
      throw err;
    }
  }

  // ── Step validation ──────────────────────────────────────────────────────────

  function validateStep(index) {
    if (index === 0) {
      const errs = validateCourseDetails(course.details);
      setDetailsErrors(errs);
      return Object.keys(errs).length === 0;
    }
    if (index === 1) {
      const result = validateModulesStep(course.modules);
      setModuleStepErrors(result);
      if (stepHasErrors(result)) {
        const badModuleId = Object.keys(result.modules)[0] ?? (Object.keys(result.lessons)[0] && findModuleIdByLessonId(course.modules, Object.keys(result.lessons)[0]));
        if (badModuleId) setSelectedModuleId(badModuleId);
        return false;
      }
      return true;
    }
    if (index === 2) {
      const result = validateAssessmentStep(course.assessment);
      setAssessmentStepErrors(result);
      if (stepHasErrors(result)) {
        const badQuestionId = Object.keys(result.questions)[0];
        if (badQuestionId) setSelectedQuestionId(badQuestionId);
        return false;
      }
      return true;
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(currentStep)) {
      setToast({ tone: "error", message: "Please fix the highlighted fields before continuing." });
      return;
    }
    const next = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(next);
    setMaxReachedIndex((m) => Math.max(m, next));
  }

  function handlePrevious() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function goToStep(index) {
    if (index > maxReachedIndex) return;
    setCurrentStep(index);
  }

  async function handleSaveDraft() {
    try {
      await persistAll();
      setToast({ tone: "success", message: "Draft saved successfully." });
    } catch {}
  }

  async function handlePublish() {
    const detailsErrs = validateCourseDetails(course.details);
    const modulesResult = validateModulesStep(course.modules);
    const assessmentResult = validateAssessmentStep(course.assessment);
    const confirmErr = validatePublishConfirmation(course.publish);

    setDetailsErrors(detailsErrs);
    setModuleStepErrors(modulesResult);
    setAssessmentStepErrors(assessmentResult);
    setPublishErrors({ confirmed: confirmErr });

    const badStepIndex = [Object.keys(detailsErrs).length > 0, stepHasErrors(modulesResult), stepHasErrors(assessmentResult), Boolean(confirmErr)].findIndex(Boolean);

    if (badStepIndex !== -1) {
      setCurrentStep(badStepIndex);
      setMaxReachedIndex((m) => Math.max(m, badStepIndex));
      setToast({ tone: "error", message: "Please resolve the highlighted issues before publishing." });
      return;
    }

    try {
      await persistAll("Published");
      setToast({ tone: "success", message: "Course published successfully." });
      setTimeout(() => navigate(ROUTES.COURSES), 900);
    } catch {}
  }

  function handleCancel() {
    if (dirty) setConfirmAction("cancel");
    else navigate(ROUTES.COURSES);
  }

  const stepErrorFlags = [
    Object.keys(detailsErrors).length > 0,
    stepHasErrors(moduleStepErrors),
    stepHasErrors(assessmentStepErrors),
    Boolean(publishErrors.confirmed),
  ];

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body cw-body">
        <div className="cw-sticky-header">
          <div className="cw-header-text">
            <h1>Create New Course</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Course Management</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">Create Course</span>
            </p>
          </div>

          <div className="cw-header-actions">
            <button type="button" className="cl-btn" onClick={handleSaveDraft} disabled={saving}>
              <Icon name="download" size={15} style={{ transform: "rotate(90deg)" }} />
              Save Draft
            </button>
            <button type="button" className="cl-btn" onClick={() => setPreviewOpen(true)}>
              <Icon name="eye" size={15} />
              Preview
            </button>
            <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>
              <Icon name="close" size={15} />
              Cancel
            </button>
          </div>
        </div>

        {loading ? (
          <CourseWizardSkeleton />
        ) : (
          <>
            <CourseStepper steps={STEPS} currentIndex={currentStep} maxReachedIndex={maxReachedIndex} stepErrors={stepErrorFlags} onStepClick={goToStep} />

            <div className="panel cw-panel">
              <div key={currentStep} className="cw-panel-inner">
                {currentStep === 0 && (
                  <CourseDetailsStep
                    data={course.details}
                    errors={detailsErrors}
                    categories={categories}
                    onChange={updateDetails}
                    onThumbnailChange={updateThumbnail}
                    onCancel={handleCancel}
                    onSaveDraft={handleSaveDraft}
                    onNext={handleNext}
                    saving={saving}
                  />
                )}

                {currentStep === 1 && (
                  <ModulesLessonsStep
                    modules={course.modules}
                    selectedModuleId={effectiveModuleId}
                    errors={moduleStepErrors}
                    onSelectModule={setSelectedModuleId}
                    onAddModule={addModule}
                    onDeleteModule={deleteModule}
                    onModuleFieldChange={updateModuleField}
                    onAddLesson={addLesson}
                    onDeleteLesson={deleteLesson}
                    onLessonFieldChange={updateLessonField}
                    onAddResource={addResource}
                    onResourceChange={updateResourceField}
                    onResourceRemove={removeResource}
                    onPrevious={handlePrevious}
                    onSaveDraft={handleSaveDraft}
                    onNext={handleNext}
                    saving={saving}
                  />
                )}

                {currentStep === 2 && (
                  <AssessmentStep
                    assessment={course.assessment}
                    errors={assessmentStepErrors}
                    selectedQuestionId={effectiveQuestionId}
                    onToggleEnabled={toggleAssessmentEnabled}
                    onFieldChange={updateAssessmentField}
                    onSelectQuestion={setSelectedQuestionId}
                    onAddQuestion={addQuestion}
                    onDeleteQuestion={deleteQuestion}
                    onQuestionFieldChange={updateQuestionField}
                    onOptionChange={updateOption}
                    onCorrectAnswerChange={updateCorrectAnswer}
                    onSaveQuestion={saveQuestion}
                    onPrevious={handlePrevious}
                    onSaveDraft={handleSaveDraft}
                    onNext={handleNext}
                    saving={saving}
                  />
                )}

                {currentStep === 3 && (
                  <PublishStep
                    details={course.details}
                    modules={course.modules}
                    assessment={course.assessment}
                    publish={course.publish}
                    errors={publishErrors}
                    onFieldChange={updatePublishField}
                    onPrevious={handlePrevious}
                    onSaveDraft={handleSaveDraft}
                    onPublish={handlePublish}
                    saving={saving}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmAction === "cancel" && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes. Leaving now will discard them."
          confirmLabel="Discard"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            navigate(ROUTES.COURSES);
          }}
        />
      )}

      {previewOpen && (
        <Modal title="Course Preview" size="lg" onClose={() => setPreviewOpen(false)}>
          <PublishSummary details={course.details} modules={course.modules} assessment={course.assessment} />
        </Modal>
      )}
    </>
  );
}

function CourseWizardSkeleton() {
  return (
    <div className="cw-skeleton">
      <div className="cw-skeleton-steps">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="cw-skeleton-circle" />
        ))}
      </div>
      <div className="panel cw-skeleton-panel">
        <span className="cw-skeleton-block w-30" />
        <span className="cw-skeleton-block w-100 tall" />
        <span className="cw-skeleton-block w-60" />
        <span className="cw-skeleton-block w-100" />
      </div>
    </div>
  );
}
