const EXISTING_COURSE_COUNT = 128;

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

export const LESSON_TYPES = ["Video", "PDF", "PPT", "Audio", "Document", "Quiz"];

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
export const QUESTION_TYPES = ["MCQ", "True / False", "Short Answer", "Essay"];
export const OPTION_LABELS = ["A", "B", "C", "D"];

export const VISIBILITY_OPTIONS = ["Company Only", "Private"];
export const PUBLISH_DATE_MODES = ["Immediately", "Schedule"];

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function generateCourseCode() {
  return `CRS-${String(EXISTING_COURSE_COUNT + 1).padStart(3, "0")}`;
}

export function generateAssessmentCode() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ASM-${year}-${random}`;
}

export function emptyModule(sequence) {
  return {
    id: uid("mod"),
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
    title: "",
    type: LESSON_TYPES[0],
    duration: "",
    description: "",
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
    type: QUESTION_TYPES[0],
    question: "",
    marks: "",
    sequence,
    options: OPTION_LABELS.map((label) => ({ id: uid("opt"), label, text: "" })),
    correctOptionId: "",
  };
}
