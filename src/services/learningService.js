import httpClient, { toApiError } from "./axios.js";

// Employee-facing "My Learning" — assigned courses, lesson viewer, mark
// lesson complete. Counterpart to courseService.js, which is admin-authoring.

// GET /companies/{company}/my-learning/courses
export async function getMyCourses(companyId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-learning/courses`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load your courses.");
  }
}

// GET /companies/{company}/my-learning/courses/{course}
export async function getMyCourse(companyId, courseId) {
  try {
    const res = await httpClient.get(`/companies/${companyId}/my-learning/courses/${courseId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this course.");
  }
}

// POST /companies/{company}/my-learning/lessons/{lesson}/complete
export async function completeLesson(companyId, lessonId) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/my-learning/lessons/${lessonId}/complete`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not mark this lesson complete.");
  }
}

// POST /companies/{company}/assignments/{assignment}/submissions/start
export async function startAssignment(companyId, assignmentId) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/assignments/${assignmentId}/submissions/start`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not start this assignment.");
  }
}

// PATCH /companies/{company}/assignments/{assignment}/submissions/{submission}/submit
// (multipart/form-data — method-spoofed like other file uploads in this app,
// since PHP doesn't populate $_FILES for a literal PATCH body)
export async function submitAssignment(companyId, assignmentId, submissionId, { submissionText, file } = {}) {
  try {
    const formData = new FormData();
    formData.append("_method", "PATCH");
    if (submissionText) formData.append("submission_text", submissionText);
    if (file) formData.append("file", file);

    const res = await httpClient.post(
      `/companies/${companyId}/assignments/${assignmentId}/submissions/${submissionId}/submit`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not submit this assignment.");
  }
}

// ── Assessments (quizzes — distinct from Assignments/homework) ─────────────

// POST /companies/{company}/assessments/{assessment}/attempts
// Starts a new attempt, or resumes an in-progress one. Response includes
// the attempt AND the assessment's Active questions/options (answer key
// stripped server-side) so the quiz can render immediately.
export async function startAssessmentAttempt(companyId, assessmentId) {
  try {
    const res = await httpClient.post(`/companies/${companyId}/assessments/${assessmentId}/attempts`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not start this assessment.");
  }
}

// POST /companies/{company}/assessments/{assessment}/attempts/{attempt}/answers
export async function saveAssessmentAnswers(companyId, assessmentId, attemptId, answers) {
  try {
    const res = await httpClient.post(
      `/companies/${companyId}/assessments/${assessmentId}/attempts/${attemptId}/answers`,
      { answers }
    );
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not save your answers.");
  }
}

// PATCH /companies/{company}/assessments/{assessment}/attempts/{attempt}/submit
export async function submitAssessmentAttempt(companyId, assessmentId, attemptId) {
  try {
    const res = await httpClient.patch(`/companies/${companyId}/assessments/${assessmentId}/attempts/${attemptId}/submit`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not submit this assessment.");
  }
}
