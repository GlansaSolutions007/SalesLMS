// Plain-JS logic shared by LessonTypeFields.jsx (the UI) and
// courseWizardValidation.js (which must NOT pull in React components/Tiptap
// just to validate a lesson) — kept separate from the component file for
// exactly that reason.

export const LESSON_TYPE_FORM_OPTIONS = ["Content", "Video", "PDF"];

// Each caller maps this generic result onto its own error-state shape (see
// Lessons.jsx's validate() and courseWizardValidation.js's validateLesson()).
export function validateLessonTypeFields({ lessonType, description, videoSource, videoUrl, videoFilePath, pdfFilePath }) {
  const errors = {};
  if (lessonType === "Content") {
    const isEmpty = !description || description === "<p></p>";
    if (isEmpty) errors.description = "Description is required.";
  } else if (lessonType === "Video") {
    if (videoSource === "upload" && !videoFilePath) {
      errors.videoFilePath = "Video upload is required.";
    } else if (videoSource === "external" && !videoUrl?.trim()) {
      errors.videoUrl = "Video URL is required.";
    }
  } else if (lessonType === "PDF") {
    if (!pdfFilePath) errors.pdfFilePath = "PDF upload is required.";
  }
  return errors;
}
