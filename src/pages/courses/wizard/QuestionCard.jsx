import Icon from "../../../components/Icon.jsx";
import { plainText } from "./courseWizardValidation.js";

export default function QuestionCard({ question, index, isActive, hasError, onClick, onDelete }) {
  const preview = plainText(question.question);

  return (
    <div className={`module-card${isActive ? " is-active" : ""}${hasError ? " has-error" : ""}`} onClick={onClick} role="button" tabIndex={0}>
      <span className="module-card-index">{index + 1}</span>
      <div className="module-card-text">
        <p>{preview || `Question ${index + 1}`}</p>
        <span>
          {question.type} · {question.marks ? `${question.marks} marks` : "No marks set"}
        </span>
      </div>
      <button
        type="button"
        className="module-card-delete"
        aria-label="Delete question"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}
