import { Fragment, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import Toast from "../../components/Toast.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getMyCourse,
  completeLesson,
  startAssignment,
  submitAssignment,
  startAssessmentAttempt,
  saveAssessmentAnswers,
  submitAssessmentAttempt,
} from "../../services/learningService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import LessonMedia from "../../components/LessonMedia.jsx";
import "../../components/RichTextEditor.css";
import "../CourseList.css";
import "./CoursePlayer.css";

const LESSON_TYPE_ICON = { Content: "book", Video: "play", PDF: "file", PPT: "file", Audio: "file", Document: "file", Quiz: "clipboard" };
const LESSON_TYPE_TONE = { Content: "blue", Video: "purple", PDF: "orange", PPT: "orange", Audio: "green", Document: "gray", Quiz: "pink" };

function flattenLessons(modules) {
  const flat = [];
  (modules ?? []).forEach((m) => (m.lessons ?? []).forEach((l) => flat.push({ ...l, module_name: m.module_name })));
  return flat;
}

// The unified learning sequence the sidebar renders and Resume Learning
// walks: every Lesson, immediately followed by its own Lesson Assessment
// if one exists, module by module, then the Final Assessment last. Module-
// level "between lessons" Assessments are deliberately NOT part of this
// list — they keep their existing standalone panel (rendered after a
// module's lessons, see the sidebar loop below), unchanged by this feature.
function buildActivities(modules, finalAssessment) {
  const activities = [];
  (modules ?? []).forEach((m) => {
    (m.lessons ?? []).forEach((l) => {
      activities.push({ kind: "lesson", lesson: l, module: m });
      if (l.assessment) {
        activities.push({ kind: "lessonAssessment", assessment: l.assessment, attempt: l.assessment_attempt, lesson: l, module: m });
      }
    });
  });
  if (finalAssessment) {
    activities.push({ kind: "finalAssessment" });
  }
  return activities;
}

function activityKey(activity) {
  if (!activity) return null;
  if (activity.kind === "lesson") return `lesson:${activity.lesson.id}`;
  if (activity.kind === "lessonAssessment") return `lessonAssessment:${activity.assessment.id}`;
  return "finalAssessment";
}

// "Completed" for an Assessment specifically means Passed — a submitted-
// but-not-yet-evaluated or failed attempt still needs action, so it isn't
// treated as done (same distinction AssessmentPanel already draws).
function isActivityCompleted(activity, finalAttempt) {
  if (activity.kind === "lesson") return !!activity.lesson.is_completed;
  if (activity.kind === "lessonAssessment") return activity.attempt?.result === "Pass";
  return finalAttempt?.result === "Pass";
}

// Lock rules per the spec: a Lesson Assessment unlocks once its own Lesson
// is complete (mirrors AssessmentPanel's existing readyToStart={is_completed}
// gate); the Final Assessment unlocks once every lesson AND every
// intermediate assessment is complete (same condition the standalone Final
// Assessment panel already used). A Lesson's own lock comes straight from
// the backend (resolveLessonLocks() — now also gated on the previous
// lesson's Assessment, see LearningController).
function isActivityLocked(activity, allComplete, allAssessmentsComplete) {
  if (activity.kind === "lesson") return !!activity.lesson.is_locked;
  if (activity.kind === "lessonAssessment") return !activity.lesson.is_completed;
  return !(allComplete && allAssessmentsComplete);
}

function activityStatusIcon(locked, completed, defaultIcon) {
  if (locked) return "lock";
  if (completed) return "check";
  return defaultIcon;
}

// Generic Start -> In Progress -> Submitted -> Evaluated/Rejected state
// machine, reused for both the whole-course homework Assignment (shown
// once every lesson is complete) and a lesson-level Assignment (shown
// under that one lesson once it's marked complete). `emptyNode`/`lockedNode`
// let each call site supply its own copy for "no assignment here" / "not
// unlocked yet" without duplicating the state machine itself.
function AssignmentPanel({ companyId, assignment, submission, readyToStart, lockedNode, emptyNode, onChanged, compact }) {
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!assignment) {
    return emptyNode ?? null;
  }

  if (!readyToStart) {
    return lockedNode;
  }

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      await startAssignment(companyId, assignment.id);
      onChanged();
    } catch (err) {
      setError(err.message ?? "Could not start the assignment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!submissionText.trim() && !submissionFile) {
      setError("Provide submission text or attach a file before submitting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitAssignment(companyId, assignment.id, submission.id, {
        submissionText: submissionText.trim() || null,
        file: submissionFile,
      });
      onChanged();
    } catch (err) {
      setError(err.message ?? "Could not submit the assignment.");
    } finally {
      setBusy(false);
    }
  }

  const panelStyle = compact ? { marginTop: 16, padding: 16 } : { marginBottom: 16, padding: 20 };
  const inlineStyle = compact ? { marginTop: 16 } : { marginBottom: 16 };

  if (!submission) {
    return (
      <div className="panel" style={panelStyle}>
        <h3 className="cv-section-title">Assignment: {assignment.assignment_title}</h3>
        <p>{assignment.description || "Complete this assignment to continue."}</p>
        {error && <p className="rl-api-error">{error}</p>}
        <button type="button" className="dash-primary-btn" disabled={busy} onClick={handleStart}>
          {busy ? "Starting…" : "Start Assignment"}
        </button>
      </div>
    );
  }

  if (submission.status === "In Progress") {
    return (
      <div className="panel" style={panelStyle}>
        <h3 className="cv-section-title">Assignment: {assignment.assignment_title}</h3>
        <Badge tone="orange">In Progress</Badge>
        {error && <p className="rl-api-error" style={{ marginTop: 10 }}>{error}</p>}
        <div style={{ marginTop: 12 }}>
          <FormField label="Your Answer">
            <textarea rows={5} value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} placeholder="Write your submission here..." />
          </FormField>
          <FormField label="Attach a File (optional — PDF, Word, PPT, Excel, image, or ZIP, up to 10 MB)">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              onChange={(e) => setSubmissionFile(e.target.files?.[0] ?? null)}
            />
            {submissionFile && <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>Selected: {submissionFile.name}</p>}
          </FormField>
        </div>
        <button type="button" className="dash-primary-btn" disabled={busy} onClick={handleSubmit}>
          {busy ? "Submitting…" : "Submit Assignment"}
        </button>
      </div>
    );
  }

  if (submission.status === "Submitted") {
    return (
      <div className="panel cv-empty-inline" style={inlineStyle}>
        <Icon name="clock" size={22} />
        <p><b>Assignment submitted.</b> Awaiting trainer review.</p>
      </div>
    );
  }

  if (submission.status === "Evaluated") {
    return (
      <div className="panel cv-empty-inline" style={{ ...inlineStyle, background: "var(--color-success-bg, #ecfdf5)" }}>
        <Icon name="trophy" size={22} filled />
        <p>
          <b>Assignment passed!</b> {submission.marks != null && `Marks: ${submission.marks}.`} {submission.feedback}
        </p>
      </div>
    );
  }

  return (
    <div className="panel cv-empty-inline" style={inlineStyle}>
      <Icon name="warning" size={22} />
      <p><b>Assignment not passed.</b> {submission.feedback || "Contact your trainer for next steps."}</p>
    </div>
  );
}

// Not-started / Submitted / Evaluated states for a quiz — mirrors
// AssignmentPanel's shape, but the "In Progress" (question-answering) state
// has been lifted out to AssessmentAttemptForm below and is driven entirely
// by CoursePlayer, not rendered here. That's because starting an assessment
// now locks the whole course (see the business rule in CoursePlayer), which
// swaps this inline panel out for a full-page locked view — an inline
// instance would otherwise be unmounted the instant it succeeded, losing
// the very state it just fetched. `onStarted(result)` hands the freshly
// started/resumed attempt (with its unmasked-but-answer-stripped questions)
// up to CoursePlayer instead of holding it locally.
function AssessmentPanel({ companyId, assessment, attempt, readyToStart, lockedNode, emptyNode, onStarted, compact }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!assessment) {
    return emptyNode ?? null;
  }

  if (!readyToStart) {
    return lockedNode;
  }

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      const result = await startAssessmentAttempt(companyId, assessment.id);
      onStarted(result);
    } catch (err) {
      setError(err.message ?? "Could not start this assessment.");
    } finally {
      setBusy(false);
    }
  }

  const panelStyle = compact ? { marginTop: 16, padding: 16 } : { marginBottom: 16, padding: 20 };
  const inlineStyle = compact ? { marginTop: 16 } : { marginBottom: 16 };

  // Never attempted, or a prior in-progress attempt resumed from a page
  // refresh (CoursePlayer only has the metadata for that until Resume is
  // clicked, since the question set only ever comes from start()).
  if (!attempt || attempt.status === "In Progress") {
    return (
      <div className="panel" style={panelStyle}>
        <h3 className="cv-section-title">Assessment: {assessment.assessment_title}</h3>
        <p className="cv-quiz-meta">
          {assessment.duration_minutes ? `${assessment.duration_minutes} min · ` : ""}
          Pass marks: {assessment.pass_marks ?? "—"} / {assessment.total_marks ?? "—"}
        </p>
        {error && <p className="rl-api-error">{error}</p>}
        <button type="button" className="dash-primary-btn" disabled={busy} onClick={handleStart}>
          {busy ? "Loading…" : attempt ? "Resume Assessment" : "Start Assessment"}
        </button>
      </div>
    );
  }

  if (attempt.status === "Submitted") {
    return (
      <div className="panel cv-empty-inline" style={inlineStyle}>
        <Icon name="clock" size={22} />
        <p><b>Assessment submitted.</b> Awaiting evaluation for written questions.</p>
      </div>
    );
  }

  if (attempt.result === "Pass") {
    return (
      <div className="panel cv-empty-inline" style={{ ...inlineStyle, background: "var(--color-success-bg, #ecfdf5)" }}>
        <Icon name="trophy" size={22} filled />
        <p><b>Assessment passed!</b> Score: {attempt.score} ({attempt.percentage}%).</p>
      </div>
    );
  }

  return (
    <div className="panel cv-empty-inline" style={inlineStyle}>
      <Icon name="warning" size={22} />
      <p><b>Assessment not passed.</b> Score: {attempt.score} ({attempt.percentage}%).</p>
      {error && <p className="rl-api-error">{error}</p>}
      <button type="button" className="cl-btn" disabled={busy} onClick={handleStart}>
        {busy ? "Loading…" : "Retake Assessment"}
      </button>
    </div>
  );
}

// The actual question-answering UI for an in-progress attempt — only ever
// rendered inside CoursePlayer's course-locked view (see
// resolveLessonAssessments()/isCourseLocked() on the backend). `assessment`
// here is the unmasked-answers shape returned by startAssessmentAttempt()
// (has `.questions[].options`), not the metadata-only shape showCourse()
// returns elsewhere on this page.
function AssessmentAttemptForm({ companyId, assessment, attempt, onSubmitted }) {
  const [selectedOptions, setSelectedOptions] = useState(() => {
    const seed = {};
    (attempt.answers ?? []).forEach((a) => { if (a.selected_option_id) seed[a.question_id] = a.selected_option_id; });
    return seed;
  });
  const [answerTexts, setAnswerTexts] = useState(() => {
    const seed = {};
    (attempt.answers ?? []).forEach((a) => { if (a.answer_text) seed[a.question_id] = a.answer_text; });
    return seed;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const questions = assessment.questions ?? [];

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      const answers = questions.map((q) => ({
        question_id: q.id,
        selected_option_id: selectedOptions[q.id] ?? null,
        answer_text: answerTexts[q.id] ?? null,
      })).filter((a) => a.selected_option_id || a.answer_text);

      if (answers.length) {
        await saveAssessmentAnswers(companyId, assessment.id, attempt.id, answers);
      }
      await submitAssessmentAttempt(companyId, assessment.id, attempt.id);
      onSubmitted();
    } catch (err) {
      setError(err.message ?? "Could not submit this assessment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Badge tone="orange">In Progress</Badge>
      {error && <p className="rl-api-error" style={{ marginTop: 10 }}>{error}</p>}

      <div className="cv-quiz-questions">
        {questions.map((q, idx) => (
          <div className="cv-quiz-question" key={q.id}>
            <p className="cv-quiz-question-text">
              <b>Q{idx + 1}.</b> {q.question} <span className="cv-quiz-marks">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
            </p>

            {(q.question_type === "MCQ" || q.question_type === "True/False") ? (
              <div className="cv-quiz-options">
                {q.options.map((opt) => (
                  <label key={opt.id} className={`cv-quiz-option${selectedOptions[q.id] === opt.id ? " is-selected" : ""}`}>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={selectedOptions[q.id] === opt.id}
                      onChange={() => setSelectedOptions((s) => ({ ...s, [q.id]: opt.id }))}
                    />
                    {opt.option_text}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows={3}
                className="cv-quiz-answer-text"
                value={answerTexts[q.id] ?? ""}
                onChange={(e) => setAnswerTexts((t) => ({ ...t, [q.id]: e.target.value }))}
                placeholder="Type your answer here..."
              />
            )}
          </div>
        ))}
      </div>

      <button type="button" className="dash-primary-btn" disabled={busy} onClick={handleSubmit}>
        {busy ? "Submitting…" : "Submit Assessment"}
      </button>
    </>
  );
}

export default function CoursePlayer() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  // Selects a Lesson, a Lesson Assessment, or the Final Assessment — see
  // buildActivities()/activityKey() above. Replaces the old lesson-only
  // selectedLessonId now that the sidebar navigates between all three.
  const [selectedKey, setSelectedKey] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState(null);
  // The assessment currently locking the course, if any — { attempt,
  // assessment } with full questions, set the instant Start/Resume/Retake
  // succeeds (see AssessmentPanel's onStarted). Cleared on submit. This is
  // the *richer* companion to data.active_assessment_attempt (which the
  // backend always includes as metadata-only, so a page refresh mid-quiz
  // still shows the locked view — just needing one Resume click to fetch
  // the actual questions again).
  const [activeQuiz, setActiveQuiz] = useState(null);

  function load() {
    setStatus("loading");
    getMyCourse(companyId, courseId)
      .then((result) => {
        setData(result);
        setStatus("success");
        // Resume Learning: the first not-yet-completed activity in
        // sequence — a Lesson, its Lesson Assessment, or the Final
        // Assessment — whichever comes first. Falls back to the last
        // activity (e.g. showing the Final Assessment's result) once
        // everything's done. Only seeds on first load (prev ??) — an
        // explicit selection (sidebar click, or the auto-advance below)
        // always wins over a later reload triggered by that same action.
        const activities = buildActivities(result.course?.modules, result.final_assessment);
        const resumeTarget = activities.find((a) => !isActivityCompleted(a, result.my_final_attempt)) ?? activities[activities.length - 1] ?? null;
        setSelectedKey((prev) => prev ?? activityKey(resumeTarget));
      })
      .catch((err) => {
        setErrorMessage(err.message ?? "Could not load this course.");
        setStatus("error");
      });
  }

  useEffect(() => {
    if (!companyId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, courseId]);

  const modules = data?.course?.modules ?? [];
  const flatLessons = flattenLessons(modules);
  const activities = buildActivities(modules, data?.final_assessment ?? null);
  const selectedIndex = activities.findIndex((a) => activityKey(a) === selectedKey);
  const selectedActivity = selectedIndex >= 0 ? activities[selectedIndex] : null;
  const nextActivity = selectedIndex >= 0 ? activities[selectedIndex + 1] : null;
  const selectedLesson = selectedActivity?.kind === "lesson" ? selectedActivity.lesson : null;

  async function handleMarkComplete() {
    if (!selectedLesson || selectedLesson.is_completed) return;
    setCompleting(true);
    try {
      await completeLesson(companyId, selectedLesson.id);
      setToast({ tone: "success", message: "Lesson marked complete." });
      // Advance to whatever's next in sequence — that lesson's own
      // Assessment if it has one, otherwise the next Lesson.
      if (nextActivity) setSelectedKey(activityKey(nextActivity));
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not mark this lesson complete." });
    } finally {
      setCompleting(false);
    }
  }

  if (status === "loading") {
    return (
      <>
        <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />
        <div className="cl-body">
          <Skeleton height={400} />
        </div>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />
        <div className="cl-body">
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this course</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.MY_LEARNING)}>
              Back to My Learning
            </button>
          </div>
        </div>
      </>
    );
  }

  const {
    course,
    all_lessons_complete: allComplete,
    all_assessments_complete: allAssessmentsComplete,
    completion_percent: completionPercent,
    homework_assignment: homeworkAssignment,
    my_submission: mySubmission,
    final_assessment: finalAssessment,
    my_final_attempt: myFinalAttempt,
    active_assessment_attempt: activeAssessmentAttempt,
  } = data;

  // Whichever assessment is currently locking the course — whatever's been
  // fetched locally (has full questions, ready to render the answer form)
  // takes priority over the server's metadata-only summary (which is all a
  // fresh page load has until Resume is clicked). Business rule: once an
  // employee starts ANY assessment (lesson-level or Final), every lesson —
  // completed or not — is hidden until it's submitted/evaluated.
  const lockInfo = activeQuiz
    ? { attempt: activeQuiz.attempt, assessment: activeQuiz.assessment, hasQuestions: true }
    : activeAssessmentAttempt
    ? { attempt: activeAssessmentAttempt, assessment: activeAssessmentAttempt.assessment, hasQuestions: false }
    : null;

  function handleAssessmentSubmitted() {
    // Deliberately does NOT auto-advance to the next activity — unlike
    // completing a Lesson (which has no result to review), submitting an
    // Assessment has a Pass/Fail result the employee should actually see
    // (AssessmentPanel's "Assessment passed!"/"not passed" state) before
    // moving on. Resume Learning already covers "pick up where I left off"
    // on the next page load/reopen; jumping away immediately here would
    // hide the very feedback that load is meant to show.
    setActiveQuiz(null);
    load();
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <button type="button" className="cl-btn ep-back-btn cv-back-btn" onClick={() => navigate(ROUTES.MY_LEARNING)}>
          <Icon name="back" size={15} />
          Back to My Learning
        </button>

        <div className="panel cv-hero">
          <div className={`cv-hero-thumb${course.thumbnail ? "" : " tone-blue"}`}>
            {course.thumbnail ? (
              <img src={resolveApiAssetUrl(course.thumbnail)} alt="" />
            ) : (
              <Icon name="book" size={30} />
            )}
          </div>
          <div className="cv-hero-body">
            <Breadcrumb current={course.course_name} />
            <h1>{course.course_name}</h1>
            <div className="cv-hero-meta">
              {course.category?.category_name && (
                <span className="cv-hero-chip"><Icon name="gridView" size={13} /> {course.category.category_name}</span>
              )}
              {course.difficulty_level && (
                <span className="cv-hero-chip"><Icon name="cap" size={13} /> {course.difficulty_level}</span>
              )}
              <span className="cv-hero-chip"><Icon name="book" size={13} /> {flatLessons.length} lesson{flatLessons.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div className="cv-hero-progress">
            <div className="cv-hero-progress-ring" style={{ "--pct": completionPercent }}>
              <span>{completionPercent}%</span>
            </div>
            <p>{data.completed_lessons} of {data.total_lessons} lessons</p>
          </div>
        </div>

        {/* <div className="panel cv-progress-card">
          <ProgressBar value={completionPercent} />
        </div> */}

        {lockInfo ? (
          // Business rule: starting ANY assessment (lesson-level or Final)
          // immediately hides every lesson — completed or not — and shows
          // only this. Same lock the backend enforces (isCourseLocked()),
          // so this can't be bypassed by refreshing or deep-linking either.
          <div className="panel cv-assessment-lock">
            <div className="cv-assessment-lock-head">
              <Icon name="lock" size={20} />
              <div>
                <h3 className="cv-section-title">Assessment In Progress</h3>
                <p className="cv-quiz-meta">Complete this assessment to continue learning.</p>
              </div>
            </div>
            {lockInfo.hasQuestions ? (
              <AssessmentAttemptForm
                companyId={companyId}
                assessment={lockInfo.assessment}
                attempt={lockInfo.attempt}
                onSubmitted={handleAssessmentSubmitted}
              />
            ) : (
              <AssessmentPanel
                companyId={companyId}
                assessment={lockInfo.assessment}
                attempt={lockInfo.attempt}
                readyToStart
                onStarted={setActiveQuiz}
                emptyNode={null}
                lockedNode={null}
              />
            )}
          </div>
        ) : (
          <>
            <AssignmentPanel
              companyId={companyId}
              assignment={homeworkAssignment}
              submission={mySubmission}
              readyToStart={allComplete}
              onChanged={load}
              emptyNode={
                allComplete ? (
                  <div className="panel cv-empty-inline" style={{ marginBottom: 16 }}>
                    <Icon name="check" size={22} />
                    <p><b>All lessons complete.</b> This course has no whole-course assignment — nothing further is required.</p>
                  </div>
                ) : null
              }
              lockedNode={
                <div className="panel cv-empty-inline" style={{ marginBottom: 16 }}>
                  <Icon name="lock" size={22} />
                  <p>Complete every lesson to unlock the assignment: <b>{homeworkAssignment?.assignment_title}</b>.</p>
                </div>
              }
            />

            <div className="course-player-layout">
          <div className="panel course-player-sidebar">
            {modules.map((m) => {
              const moduleLessons = m.lessons ?? [];
              // "Module Progress should include Lessons + Lesson
              // Assessments" — e.g. "Sales Fundamentals 5/6 Completed".
              const moduleActivityTotal = moduleLessons.reduce((sum, l) => sum + 1 + (l.assessment ? 1 : 0), 0);
              const moduleActivityDone = moduleLessons.reduce(
                (sum, l) => sum + (l.is_completed ? 1 : 0) + (l.assessment && l.assessment_attempt?.result === "Pass" ? 1 : 0),
                0
              );
              return (
                <div key={m.id} className="course-player-module">
                  <div className="course-player-module-head">
                    <p className="course-player-module-title">{m.module_name}</p>
                    <span className="course-player-module-count">{moduleActivityDone}/{moduleActivityTotal}</span>
                  </div>
                  {moduleLessons.map((l) => (
                    <Fragment key={l.id}>
                      <button
                        type="button"
                        className={`course-player-lesson-item${selectedKey === activityKey({ kind: "lesson", lesson: l }) ? " is-active" : ""}${l.is_locked ? " is-locked" : ""}`}
                        onClick={() => setSelectedKey(activityKey({ kind: "lesson", lesson: l }))}
                      >
                        <span className={`cv-lesson-status${l.is_completed ? " is-done" : ""}${l.is_locked ? " is-locked" : ""}`}>
                          <Icon name={activityStatusIcon(l.is_locked, l.is_completed, LESSON_TYPE_ICON[l.lesson_type] ?? "file")} size={12} />
                        </span>
                        <span className="course-player-lesson-title">{l.lesson_title}</span>
                      </button>

                      {/* Lesson Assessment — unlocks once its own Lesson is
                          complete; named after the Lesson per the spec
                          ("Assessment – Introduction to Sales"). */}
                      {l.assessment && (() => {
                        const activity = { kind: "lessonAssessment", assessment: l.assessment, attempt: l.assessment_attempt, lesson: l, module: m };
                        const locked = isActivityLocked(activity, allComplete, allAssessmentsComplete);
                        const completed = isActivityCompleted(activity, myFinalAttempt);
                        return (
                          <button
                            type="button"
                            className={`course-player-lesson-item course-player-assessment-item${selectedKey === activityKey(activity) ? " is-active" : ""}${locked ? " is-locked" : ""}`}
                            onClick={() => setSelectedKey(activityKey(activity))}
                          >
                            <span className={`cv-lesson-status${completed ? " is-done" : ""}${locked ? " is-locked" : ""}`}>
                              <Icon name={activityStatusIcon(locked, completed, "clipboard")} size={12} />
                            </span>
                            <span className="course-player-lesson-title">Assessment – {l.lesson_title}</span>
                          </button>
                        );
                      })()}
                    </Fragment>
                  ))}

                  {/* Assessment sitting between this module and the next
                      (module-level — see CourseAssignment::moduleAssessments()):
                      must be passed before the next module's lessons unlock.
                      Kept as its own always-visible panel, not part of the
                      Lesson/Lesson-Assessment selectable sequence above. */}
                  <AssessmentPanel
                    companyId={companyId}
                    assessment={m.assessment}
                    attempt={m.assessment_attempt}
                    readyToStart={m.assessment_ready}
                    onStarted={setActiveQuiz}
                    compact
                    emptyNode={null}
                    lockedNode={
                      <div className="panel cv-empty-inline" style={{ marginTop: 16 }}>
                        <Icon name="lock" size={20} />
                        <p>Complete every lesson in this module to unlock: <b>{m.assessment?.assessment_title}</b>.</p>
                      </div>
                    }
                  />
                </div>
              );
            })}

            {/* Final Assessment — always the last sidebar entry, once the
                course has one. Unlocks once every Lesson and every
                intermediate Assessment (lesson-level + module-level) is
                complete. */}
            {finalAssessment && (() => {
              const activity = { kind: "finalAssessment" };
              const locked = isActivityLocked(activity, allComplete, allAssessmentsComplete);
              const completed = isActivityCompleted(activity, myFinalAttempt);
              return (
                <div className="course-player-module">
                  <button
                    type="button"
                    className={`course-player-lesson-item course-player-assessment-item${selectedKey === activityKey(activity) ? " is-active" : ""}${locked ? " is-locked" : ""}`}
                    onClick={() => setSelectedKey(activityKey(activity))}
                  >
                    <span className={`cv-lesson-status${completed ? " is-done" : ""}${locked ? " is-locked" : ""}`}>
                      <Icon name={activityStatusIcon(locked, completed, "trophy")} size={12} />
                    </span>
                    <span className="course-player-lesson-title">Final Assessment</span>
                  </button>
                </div>
              );
            })()}
          </div>

          <div className="panel course-player-main">
            {!selectedActivity ? (
              <p className="ep-empty-note">This course has no lessons yet.</p>
            ) : selectedActivity.kind !== "lesson" ? (
              // Lesson Assessment or Final Assessment selected — reuses the
              // exact same AssessmentPanel (Start/Resume/Result) the module-
              // level assessment and the full-page quiz lock already use,
              // just chosen by what's selected instead of always rendered.
              (() => {
                const isFinal = selectedActivity.kind === "finalAssessment";
                const assessment = isFinal ? finalAssessment : selectedActivity.assessment;
                const attempt = isFinal ? myFinalAttempt : selectedActivity.attempt;
                const locked = isActivityLocked(selectedActivity, allComplete, allAssessmentsComplete);
                const completed = isActivityCompleted(selectedActivity, myFinalAttempt);
                const lockedMessage = isFinal
                  ? allComplete
                    ? <>Complete every assessment between lessons and every lesson assessment to unlock the <b>Final Assessment</b>.</>
                    : <>Complete every lesson to unlock the <b>Final Assessment</b>.</>
                  : <>Mark <b>{selectedActivity.lesson.lesson_title}</b> complete to unlock its assessment.</>;

                return (
                  <>
                    <div className="course-player-lesson-head">
                      <div className="cv-lesson-head-title">
                        <span className={`cv-lesson-type-chip tone-${isFinal ? "purple" : "pink"}`}>
                          <Icon name={isFinal ? "trophy" : "clipboard"} size={16} />
                        </span>
                        <div>
                          <p className="tp-section-label">{isFinal ? course.course_name : selectedActivity.module.module_name}</p>
                          <h2>{isFinal ? "Final Assessment" : `Assessment – ${selectedActivity.lesson.lesson_title}`}</h2>
                          <div className="cv-profile-meta">
                            {completed && <Badge tone="green">Completed</Badge>}
                            {locked && <Badge tone="gray">Locked</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {locked ? (
                      <div className="panel cv-empty-inline" style={{ marginTop: 20 }}>
                        <Icon name="lock" size={22} />
                        <p>{lockedMessage}</p>
                      </div>
                    ) : (
                      <AssessmentPanel
                        companyId={companyId}
                        assessment={assessment}
                        attempt={attempt}
                        readyToStart
                        onStarted={setActiveQuiz}
                        emptyNode={null}
                        lockedNode={null}
                      />
                    )}
                  </>
                );
              })()
            ) : (
              <>
                <div className="course-player-lesson-head">
                  <div className="cv-lesson-head-title">
                    <span className={`cv-lesson-type-chip tone-${LESSON_TYPE_TONE[selectedLesson.lesson_type] ?? "gray"}`}>
                      <Icon name={LESSON_TYPE_ICON[selectedLesson.lesson_type] ?? "file"} size={16} />
                    </span>
                    <div>
                      <p className="tp-section-label">{selectedLesson.module_name}</p>
                      <h2>{selectedLesson.lesson_title}</h2>
                      <div className="cv-profile-meta">
                        {selectedLesson.lesson_type && <Badge tone={LESSON_TYPE_TONE[selectedLesson.lesson_type] ?? "gray"}>{selectedLesson.lesson_type}</Badge>}
                        {selectedLesson.duration_minutes && (
                          <span><Icon name="clock" size={13} /> {selectedLesson.duration_minutes} min</span>
                        )}
                        {selectedLesson.is_completed && <Badge tone="green">Completed</Badge>}
                        {selectedLesson.is_locked && <Badge tone="gray">Locked</Badge>}
                      </div>
                    </div>
                  </div>
                  {!selectedLesson.is_locked && (
                    <button
                      type="button"
                      className="dash-primary-btn"
                      disabled={selectedLesson.is_completed || completing}
                      onClick={handleMarkComplete}
                    >
                      {completing ? "Saving…" : selectedLesson.is_completed ? "Completed" : "Mark Complete"}
                    </button>
                  )}
                </div>

                {selectedLesson.is_locked ? (
                  <div className="panel cv-empty-inline" style={{ marginTop: 20 }}>
                    <Icon name="lock" size={22} />
                    <p>Complete the previous lesson — and its assignment or assessment, if it has one — to unlock this lesson.</p>
                  </div>
                ) : (
                  <>
                    <div className="cv-lesson-content">
                      <LessonMedia lesson={selectedLesson} />
                    </div>

                    {(selectedLesson.resources ?? []).length > 0 && (
                      <>
                        <div className="tp-section-label tp-section-label--gap">Resources</div>
                        <div className="dtable-wrap">
                          <table className="dtable form-doc-table">
                            <tbody>
                              {selectedLesson.resources.map((r) => {
                                const href = r.resource_type === "External Link" ? r.external_url : resolveApiAssetUrl(r.file_path);
                                return (
                                  <tr key={r.id}>
                                    <td>{r.resource_title || r.resource_type}</td>
                                    <td>
                                      {href && (
                                        <a href={href} target="_blank" rel="noreferrer" className="dash-icon-btn" aria-label="Open resource">
                                          <Icon name={r.resource_type === "External Link" ? "globe" : "download"} size={15} />
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* Lesson-level Assignment (optional): only becomes
                        startable once this lesson itself is marked complete
                        — see AssignmentSubmissionController::start(). */}
                    <AssignmentPanel
                      companyId={companyId}
                      assignment={selectedLesson.assignment}
                      submission={selectedLesson.assignment_submission}
                      readyToStart={selectedLesson.is_completed}
                      onChanged={load}
                      compact
                      lockedNode={
                        <div className="panel cv-empty-inline" style={{ marginTop: 16 }}>
                          <Icon name="lock" size={20} />
                          <p>Mark this lesson complete to unlock its assignment: <b>{selectedLesson.assignment?.assignment_title}</b>.</p>
                        </div>
                      }
                    />
                    {/* Lesson-level Assessment (optional quiz) now lives in
                        its own sidebar-selectable slot right after this
                        lesson — see the "Assessment – {lesson_title}" item
                        above and the selectedActivity.kind !== "lesson"
                        branch below, both reusing the same AssessmentPanel. */}
                  </>
                )}
              </>
            )}
          </div>
            </div>
          </>
        )}
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
