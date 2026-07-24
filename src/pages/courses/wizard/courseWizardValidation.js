function req(value, message) {
  return String(value ?? "").trim() ? null : message;
}

export function plainText(html) {
  if (typeof document === "undefined") return String(html ?? "").trim();
  const div = document.createElement("div");
  div.innerHTML = String(html ?? "");
  return (div.textContent || "").trim();
}

function compact(errors) {
  Object.keys(errors).forEach((k) => errors[k] == null && delete errors[k]);
  return errors;
}

export function validateCourseDetails(details) {
  const errors = {};
  errors.name = req(details.name, "Course name is required.");
  errors.category = req(details.category, "Course category is required.");
  errors.description = plainText(details.description) ? null : "Course description is required.";
  return compact(errors);
}

export function validateModule(module) {
  const errors = {};
  errors.name = req(module.name, "Module name is required.");
  return compact(errors);
}

export function validateLesson(lesson) {
  const errors = {};
  errors.title = req(lesson.title, "Lesson title is required.");
  return compact(errors);
}

export function validateModulesStep(modules) {
  const result = { general: null, modules: {}, lessons: {} };

  if (modules.length === 0) {
    result.general = "Add at least one module before continuing.";
    return result;
  }

  modules.forEach((module) => {
    const moduleErrors = validateModule(module);
    if (Object.keys(moduleErrors).length) result.modules[module.id] = moduleErrors;

    module.lessons.forEach((lesson) => {
      const lessonErrors = validateLesson(lesson);
      if (Object.keys(lessonErrors).length) result.lessons[lesson.id] = lessonErrors;
    });
  });

  return result;
}

export function validateQuestion(question) {
  const errors = {};
  errors.question = plainText(question.question) ? null : "Question text is required.";
  errors.marks = req(question.marks, "Marks are required.");

  if (question.type === "MCQ") {
    const filled = question.options.filter((opt) => opt.text.trim());
    if (filled.length < 2) errors.options = "Add at least 2 options.";
    else if (!question.correctOptionId || !filled.some((opt) => opt.id === question.correctOptionId)) {
      errors.correctOptionId = "Select the correct answer.";
    }
  } else if (question.type === "True / False") {
    if (question.correctOptionId !== "true" && question.correctOptionId !== "false") {
      errors.correctOptionId = "Select the correct answer.";
    }
  }

  return compact(errors);
}

export function validateAssessmentStep(assessment) {
  if (!assessment.enabled) return { general: null, fields: {}, questions: {} };

  const fields = {};
  fields.title = req(assessment.title, "Assessment title is required.");
  fields.durationMinutes = req(assessment.durationMinutes, "Duration is required.");
  fields.totalMarks = req(assessment.totalMarks, "Total marks are required.");
  fields.passMarks =
    req(assessment.passMarks, "Pass marks are required.") ||
    (Number(assessment.passMarks) > Number(assessment.totalMarks) ? "Pass marks cannot exceed total marks." : null);
  fields.maxAttempts = req(assessment.maxAttempts, "Maximum attempts is required.");
  compact(fields);

  let general = null;
  const questions = {};
  if (assessment.questions.length === 0) {
    general = "Add at least one question.";
  } else {
    assessment.questions.forEach((q) => {
      const qErrors = validateQuestion(q);
      if (Object.keys(qErrors).length) questions[q.id] = qErrors;
    });
  }

  return { general, fields, questions };
}

export function validatePublishConfirmation(publish) {
  return publish.confirmed ? null : "Please confirm the course details before publishing.";
}

export function stepHasErrors(result) {
  if (!result) return false;
  if (result.general) return true;
  if (result.fields && Object.keys(result.fields).length) return true;
  if (result.modules && Object.keys(result.modules).length) return true;
  if (result.lessons && Object.keys(result.lessons).length) return true;
  if (result.questions && Object.keys(result.questions).length) return true;
  return typeof result === "object" && !("general" in result) && Object.keys(result).length > 0;
}
