// Builds the API payload for creating/updating an AssessmentQuestion (with
// its nested options) from a locally-edited question object — shared by
// CourseWizard.jsx (course-level + lesson-level question sync) and
// AssessmentsList.jsx (the standalone Assessments admin page), so the
// question/option shape the backend expects only has one source of truth.
export function buildQuestionPayload(question, index) {
  const options = [];
  if (question.type === "MCQ") {
    question.options.forEach((opt, i) => {
      if (opt.text.trim()) {
        options.push({ option_text: opt.text, is_correct: opt.id === question.correctOptionId, sequence_no: i + 1 });
      }
    });
  } else if (question.type === "True/False") {
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
