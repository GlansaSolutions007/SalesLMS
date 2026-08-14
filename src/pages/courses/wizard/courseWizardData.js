export const COURSE_CATEGORIES = [
  "Sales Skills",
  "Communication",
  "Negotiation",
  "Product",
  "Leadership",
  "Customer Service",
  "Digital Selling",
  "Compliance",
  "Onboarding",
];

export const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];
export const COURSE_STATUSES = ["Draft", "Published", "Archived"];

// Same three options as the standalone Lessons page (LessonTypeFields.jsx) —
// Lesson Type drives which content fields LessonCard shows for a lesson.
export const LESSON_TYPES = ["Content", "Video", "PDF"];

export const RESOURCE_TYPES = ["Upload Video", "Upload PDF", "Upload PPT", "Upload Audio", "Upload ZIP", "External URL"];

export const RESOURCE_ACCEPT = {
  "Upload Video": ".mp4,.mov,.avi,.mkv",
  "Upload PDF": ".pdf",
  "Upload PPT": ".ppt,.pptx",
  "Upload Audio": ".mp3,.wav,.m4a",
  "Upload ZIP": ".zip",
};

export const RESOURCE_MAX_SIZE_MB = {
  "Upload Video": 250,
  "Upload PDF": 20,
  "Upload PPT": 20,
  "Upload Audio": 50,
  "Upload ZIP": 100,
};

export const RESOURCE_ICON = {
  "Upload Video": "video",
  "Upload PDF": "file",
  "Upload PPT": "file",
  "Upload Audio": "audio",
  "Upload ZIP": "archive",
  "External URL": "link",
};

export const ASSESSMENT_TYPES = ["Quiz", "Test", "Exam", "Practical"];
export const ASSESSMENT_STATUSES = ["Draft", "Published"];
// "True/False" (no spaces) is the exact value the backend's DB enum and
// FormRequest validation accept (assessment_questions.question_type) — any
// other spelling gets silently rejected by validation.
export const QUESTION_TYPES = ["MCQ", "True/False", "Short Answer", "Essay"];
// Lesson-level assessments only offer these two — kept intentionally
// narrower than the course-level Final Assessment's full QUESTION_TYPES.
export const LESSON_QUESTION_TYPES = ["MCQ", "True/False"];
// Bulk Modules & Lessons import only supports these two Lesson Types (no
// file upload column exists in the spreadsheet, so PDF isn't offered) —
// mirrors ModuleLessonImportController::ALLOWED_LESSON_TYPES.
export const MODULE_LESSON_BULK_TYPES = ["Content", "Video"];
export const OPTION_LABELS = ["A", "B", "C", "D"];

export const VISIBILITY_OPTIONS = ["Company Only", "Private"];
export const PUBLISH_DATE_MODES = ["Immediately", "Schedule"];

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Course/assessment codes are generated server-side (CourseController /
// AssessmentController) and must stay that way — a client-generated code
// can never guarantee uniqueness against rows it doesn't know about.
// (This file used to export generateCourseCode()/generateAssessmentCode()
// for that; the course one always returned the same hardcoded "CRS-129"
// from a mock EXISTING_COURSE_COUNT constant that was never wired to real
// data, so every course after the first failed a "code already in use"
// validation error on save.)

export function emptyModule(sequence) {
  return {
    id: uid("mod"),
    apiId: null,
    name: "",
    description: "",
    estimatedDuration: "",
    sequence,
    lessons: [],
  };
}

export function emptyLesson(sequence) {
  return {
    id: uid("les"),
    apiId: null,
    title: "",
    type: LESSON_TYPES[0],
    duration: "",
    description: "",
    videoSource: "upload",
    videoUrl: "",
    videoFilePath: "",
    videoFileName: "",
    videoFileUrl: "",
    pdfFilePath: "",
    pdfFileName: "",
    pdfFileUrl: "",
    // Optional lesson-level Assignment — zero or one per lesson (see
    // Assignments.jsx / LearningController for the same feature elsewhere).
    assignmentEnabled: false,
    assignmentApiId: null,
    assignmentTitle: "",
    assignmentDescription: "",
    assignmentTotalMarks: "",
    assignmentDueDate: "",
    assignmentBlocksProgress: true,
    // Optional lesson-level Assessment — zero or one per lesson,
    // MCQ/True-False questions only. Type/Status default to the same
    // values as the course-level Final Assessment but are editable here.
    assessmentEnabled: false,
    assessmentApiId: null,
    assessmentTitle: "",
    assessmentType: ASSESSMENT_TYPES[0],
    assessmentStatus: ASSESSMENT_STATUSES[0],
    assessmentDurationMinutes: "",
    assessmentPassMarks: "",
    assessmentQuestions: [],
    sequence,
    resources: [],
  };
}

export function emptyResource() {
  return {
    id: uid("res"),
    type: RESOURCE_TYPES[0],
    file: null,
    fileName: "",
    url: "",
  };
}

export function emptyQuestion(sequence) {
  return {
    id: uid("qn"),
    apiId: null,
    type: QUESTION_TYPES[0],
    question: "",
    marks: "",
    sequence,
    options: OPTION_LABELS.map((label) => ({ id: uid("opt"), label, text: "" })),
    correctOptionId: "",
  };
}

// Builds a locally-edited question (same shape as emptyQuestion()) from one
// row of the bulk-upload preview returned by QuestionImportController::preview
// (`{ question_type, question, marks, options: [{ label, option_text, is_correct }] }`).
// Bulk-imported questions land in state exactly like a manually added one —
// nothing is sent to the API until the surrounding form is saved.
export function questionFromImportRow(row, sequence) {
  const options = OPTION_LABELS.map((label) => {
    const match = row.options?.find((o) => o.label === label);
    return { id: uid("opt"), label, text: match?.option_text ?? "" };
  });

  let correctOptionId = "";
  if (row.question_type === "MCQ") {
    const correct = row.options?.find((o) => o.is_correct);
    const optIndex = correct ? OPTION_LABELS.indexOf(correct.label) : -1;
    correctOptionId = optIndex >= 0 ? options[optIndex].id : "";
  } else if (row.question_type === "True/False") {
    const correct = row.options?.find((o) => o.is_correct);
    correctOptionId = correct?.label === "True" ? "true" : correct?.label === "False" ? "false" : "";
  }

  return {
    id: uid("qn"),
    apiId: null,
    type: row.question_type,
    question: row.question,
    marks: row.marks != null ? String(row.marks) : "",
    sequence,
    options,
    correctOptionId,
  };
}

// Builds locally-edited modules (same shape as emptyModule()/emptyLesson())
// from the grouped `modules` array returned by
// ModuleLessonImportController::preview (`{ module_name, module_description,
// lessons: [{ lesson_name, lesson_type, lesson_description, video_url,
// lesson_order }] }`, lessons already ordered by Lesson Order). Bulk-
// imported modules/lessons land in state exactly like manually added ones —
// nothing is sent to the API until the wizard itself is saved.
export function modulesFromImportRows(importedModules, startSequence) {
  return importedModules.map((m, mi) => {
    const module = emptyModule(startSequence + mi + 1);
    module.name = m.module_name;
    module.description = m.module_description || "";
    module.lessons = (m.lessons || []).map((l, li) => {
      const lesson = emptyLesson(li + 1);
      lesson.title = l.lesson_name;
      lesson.type = MODULE_LESSON_BULK_TYPES.includes(l.lesson_type) ? l.lesson_type : MODULE_LESSON_BULK_TYPES[0];
      if (lesson.type === "Content") {
        lesson.description = l.lesson_description || "";
      } else if (lesson.type === "Video") {
        lesson.videoSource = "external";
        lesson.videoUrl = l.video_url || "";
      }
      return lesson;
    });
    return module;
  });
}
