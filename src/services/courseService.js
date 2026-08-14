import httpClient, { toApiError } from "./axios.js";

const BASE = "/admin";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories() {
  try {
    const res = await httpClient.get(`${BASE}/course-categories`, { params: { all: 1, status: "Active" } });
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load categories.");
  }
}

export async function listCategoriesPaginated(params = {}) {
  try {
    const res = await httpClient.get(`${BASE}/course-categories`, { params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (err) {
    throw toApiError(err, "Could not load categories.");
  }
}

export async function createCategory(payload) {
  try {
    const res = await httpClient.post(`${BASE}/course-categories`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create category.");
  }
}

export async function updateCategory(categoryId, payload) {
  try {
    const res = await httpClient.put(`${BASE}/course-categories/${categoryId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update category.");
  }
}

export async function toggleCategoryStatus(categoryId, status) {
  try {
    const res = await httpClient.patch(`${BASE}/course-categories/${categoryId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update category status.");
  }
}

export async function deleteCategory(categoryId) {
  try {
    await httpClient.delete(`${BASE}/course-categories/${categoryId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete category.");
  }
}

// ── Courses ───────────────────────────────────────────────────────────────────

export async function listCourses(params = {}) {
  try {
    const res = await httpClient.get(`${BASE}/courses`, { params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (err) {
    throw toApiError(err, "Could not load courses.");
  }
}

export async function getCourse(courseId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load course.");
  }
}

export async function createCourse(formData) {
  try {
    const res = await httpClient.post(`${BASE}/courses`, formData);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create course.");
  }
}

// Laravel doesn't populate $_POST/$_FILES for PUT, so we POST with _method=PUT.
export async function updateCourse(courseId, formData) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`${BASE}/courses/${courseId}`, formData);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update course.");
  }
}

export async function updateCourseStatus(courseId, status) {
  try {
    const res = await httpClient.patch(`${BASE}/courses/${courseId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update course status.");
  }
}

export async function deleteCourse(courseId) {
  try {
    await httpClient.delete(`${BASE}/courses/${courseId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete course.");
  }
}

// ── Courses (dropdown helper) ─────────────────────────────────────────────────

export async function listAllCourses() {
  try {
    const res = await httpClient.get(`${BASE}/courses`, { params: { per_page: 100, sort: "course_name", dir: "asc" } });
    const body = res.data?.data ?? res.data;
    return body?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load courses.");
  }
}

// ── Modules ───────────────────────────────────────────────────────────────────

export async function listModules(courseId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/modules`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load modules.");
  }
}

export async function toggleModuleStatus(courseId, moduleApiId, status) {
  try {
    const res = await httpClient.patch(`${BASE}/courses/${courseId}/modules/${moduleApiId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update module status.");
  }
}

export async function createModule(courseId, payload) {
  try {
    const res = await httpClient.post(`${BASE}/courses/${courseId}/modules`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create module.");
  }
}

export async function updateModule(courseId, moduleApiId, payload) {
  try {
    const res = await httpClient.put(`${BASE}/courses/${courseId}/modules/${moduleApiId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update module.");
  }
}

export async function deleteModule(courseId, moduleApiId) {
  try {
    await httpClient.delete(`${BASE}/courses/${courseId}/modules/${moduleApiId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete module.");
  }
}

// ── Bulk Modules & Lessons Import ───────────────────────────────────────────
// Not scoped to a course — used from the Course Wizard's "Modules &
// Lessons" step before the course itself has necessarily been saved, same
// pattern as Bulk Question Import below. preview() only parses, groups and
// validates the file; nothing is persisted until the caller merges the
// result into the local modules/lessons list and the wizard is saved (same
// path as a manually added module/lesson).

export async function downloadModuleLessonTemplate() {
  try {
    const res = await httpClient.get(`${BASE}/modules/import-template`, { responseType: "blob" });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not download the module/lesson template.");
  }
}

export async function previewModuleLessonImport(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await httpClient.post(`${BASE}/modules/import-preview`, fd);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not parse the uploaded file.");
  }
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function listLessons(courseId, moduleApiId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load lessons.");
  }
}

export async function getLesson(courseId, moduleApiId, lessonApiId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this lesson.");
  }
}

export async function toggleLessonStatus(courseId, moduleApiId, lessonApiId, status) {
  try {
    const res = await httpClient.patch(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update lesson status.");
  }
}

export async function createLesson(courseId, moduleApiId, payload) {
  try {
    const res = await httpClient.post(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create lesson.");
  }
}

export async function updateLesson(courseId, moduleApiId, lessonApiId, payload) {
  try {
    const res = await httpClient.put(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update lesson.");
  }
}

export async function deleteLesson(courseId, moduleApiId, lessonApiId) {
  try {
    await httpClient.delete(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete lesson.");
  }
}

// ── Lesson Resources ─────────────────────────────────────────────────────────

export async function listResources(courseId, moduleApiId, lessonApiId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}/resources`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load resources.");
  }
}

export async function createResource(courseId, moduleApiId, lessonApiId, formData) {
  try {
    const res = await httpClient.post(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}/resources`, formData);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not add resource.");
  }
}

export async function updateResource(courseId, moduleApiId, lessonApiId, resourceId, formData) {
  try {
    formData.append("_method", "PUT");
    const res = await httpClient.post(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}/resources/${resourceId}`, formData);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update resource.");
  }
}

export async function deleteResource(courseId, moduleApiId, lessonApiId, resourceId) {
  try {
    await httpClient.delete(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons/${lessonApiId}/resources/${resourceId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete resource.");
  }
}

// ── Media Uploads (rich text editor) ────────────────────────────────────────

export async function uploadEditorMedia(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await httpClient.post(`${BASE}/media-uploads`, fd);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not upload this file.");
  }
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function createAssessment(payload) {
  try {
    const res = await httpClient.post(`${BASE}/assessments`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create assessment.");
  }
}

export async function updateAssessment(assessmentApiId, payload) {
  try {
    const res = await httpClient.put(`${BASE}/assessments/${assessmentApiId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update assessment.");
  }
}

export async function deleteAssessment(assessmentApiId) {
  try {
    await httpClient.delete(`${BASE}/assessments/${assessmentApiId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete assessment.");
  }
}

export async function updateAssessmentStatus(assessmentApiId, status) {
  try {
    const res = await httpClient.patch(`${BASE}/assessments/${assessmentApiId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update assessment status.");
  }
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function createQuestion(assessmentApiId, payload) {
  try {
    const res = await httpClient.post(`${BASE}/assessments/${assessmentApiId}/questions`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create question.");
  }
}

export async function updateQuestion(assessmentApiId, questionApiId, payload) {
  try {
    const res = await httpClient.put(`${BASE}/assessments/${assessmentApiId}/questions/${questionApiId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update question.");
  }
}

export async function deleteQuestion(assessmentApiId, questionApiId) {
  try {
    await httpClient.delete(`${BASE}/assessments/${assessmentApiId}/questions/${questionApiId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete question.");
  }
}

// ── Bulk Question Import ─────────────────────────────────────────────────────
// Not scoped to an assessment — used before the assessment itself is saved,
// so preview() only parses/validates the file and returns question data;
// nothing is persisted until the caller merges it into the local question
// list and the surrounding form is saved (same path as a manually added
// question).

export async function downloadQuestionTemplate() {
  try {
    const res = await httpClient.get(`${BASE}/questions/import-template`, { responseType: "blob" });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Could not download the question template.");
  }
}

export async function previewQuestionImport(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await httpClient.post(`${BASE}/questions/import-preview`, fd);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not parse the uploaded file.");
  }
}

// ── Assignments (homework — distinct from Assessments/quizzes) ─────────────

export async function listCourseAssignments(courseId, params = {}) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/assignments`, { params });
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load assignments.");
  }
}

export async function createAssignment(courseId, payload) {
  try {
    const res = await httpClient.post(`${BASE}/courses/${courseId}/assignments`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not create assignment.");
  }
}

export async function updateAssignment(courseId, assignmentId, payload) {
  try {
    const res = await httpClient.put(`${BASE}/courses/${courseId}/assignments/${assignmentId}`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update assignment.");
  }
}

export async function updateAssignmentStatus(courseId, assignmentId, status) {
  try {
    const res = await httpClient.patch(`${BASE}/courses/${courseId}/assignments/${assignmentId}/status`, { status });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not update assignment status.");
  }
}

export async function deleteAssignment(courseId, assignmentId) {
  try {
    await httpClient.delete(`${BASE}/courses/${courseId}/assignments/${assignmentId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete assignment.");
  }
}

export async function listAssignmentSubmissions(assignmentId) {
  try {
    const res = await httpClient.get(`${BASE}/assignments/${assignmentId}/submissions`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load submissions.");
  }
}

export async function evaluateSubmission(assignmentId, submissionId, payload) {
  try {
    const res = await httpClient.patch(`${BASE}/assignments/${assignmentId}/submissions/${submissionId}/evaluate`, payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not save evaluation.");
  }
}

// ── Assessments (list / detail) ─────────────────────────────────────────────

export async function listAssessments(params = {}) {
  try {
    const res = await httpClient.get(`${BASE}/assessments`, { params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (err) {
    throw toApiError(err, "Could not load assessments.");
  }
}

export async function getAssessment(assessmentId) {
  try {
    const res = await httpClient.get(`${BASE}/assessments/${assessmentId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load assessment.");
  }
}

// ── Assessment Attempts (admin review + evaluation) ─────────────────────────

export async function listAttempts(assessmentId, params = {}) {
  try {
    const res = await httpClient.get(`${BASE}/assessments/${assessmentId}/attempts`, { params });
    const body = res.data?.data ?? res.data;
    return {
      items: body?.data ?? [],
      pagination: { ...DEFAULT_PAGINATION, ...body?.pagination },
    };
  } catch (err) {
    throw toApiError(err, "Could not load attempts.");
  }
}

export async function getAttempt(assessmentId, attemptId) {
  try {
    const res = await httpClient.get(`${BASE}/assessments/${assessmentId}/attempts/${attemptId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not load this attempt.");
  }
}

export async function evaluateAttempt(assessmentId, attemptId, grades) {
  try {
    const res = await httpClient.patch(`${BASE}/assessments/${assessmentId}/attempts/${attemptId}/evaluate`, { grades });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw toApiError(err, "Could not save evaluation.");
  }
}

export async function deleteAttempt(assessmentId, attemptId) {
  try {
    await httpClient.delete(`${BASE}/assessments/${assessmentId}/attempts/${attemptId}`);
  } catch (err) {
    throw toApiError(err, "Could not delete this attempt.");
  }
}
