import Icon from "../../../components/Icon.jsx";

export default function ModuleCard({ module, index, isActive, hasError, onClick, onDelete }) {
  return (
    <div className={`module-card${isActive ? " is-active" : ""}${hasError ? " has-error" : ""}`} onClick={onClick} role="button" tabIndex={0}>
      <span className="module-card-index">{index + 1}</span>
      <div className="module-card-text">
        <p>{module.name.trim() || `Module ${index + 1}`}</p>
        <span>{module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"}</span>
      </div>
      <button
        type="button"
        className="module-card-delete"
        aria-label="Delete module"
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
