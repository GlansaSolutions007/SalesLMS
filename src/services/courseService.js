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

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function listLessons(courseId, moduleApiId) {
  try {
    const res = await httpClient.get(`${BASE}/courses/${courseId}/modules/${moduleApiId}/lessons`);
    return res.data?.data ?? [];
  } catch (err) {
    throw toApiError(err, "Could not load lessons.");
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
