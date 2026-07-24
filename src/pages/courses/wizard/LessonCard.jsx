import FormField from "../../../components/FormField.jsx";
import ResourceUploader from "../../../components/ResourceUploader.jsx";
import Icon from "../../../components/Icon.jsx";
import { LESSON_TYPES } from "./courseWizardData.js";

export default function LessonCard({ lesson, index, errors, resourceErrors, onChange, onDelete, onAddResource, onResourceChange, onResourceRemove }) {
  return (
    <div className="lesson-card">
      <div className="lesson-card-head">
        <span className="lesson-card-index">
          <Icon name="play" size={13} />
          Lesson {index + 1}
        </span>
        <button type="button" className="cl-btn lesson-card-delete" onClick={onDelete}>
          <Icon name="trash" size={14} />
          Delete Lesson
        </button>
      </div>

      <FormField label="Lesson Title *" error={errors.title}>
        <input type="text" value={lesson.title} onChange={(e) => onChange("title", e.target.value)} placeholder="e.g. Why Customers Buy" />
      </FormField>

      <div className="form-row">
        <FormField label="Lesson Type">
          <select value={lesson.type} onChange={(e) => onChange("type", e.target.value)}>
            {LESSON_TYPES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Lesson Duration">
          <input type="text" value={lesson.duration} onChange={(e) => onChange("duration", e.target.value)} placeholder="e.g. 12m" />
        </FormField>
      </div>

      <FormField label="Lesson Description">
        <textarea rows={3} value={lesson.description} onChange={(e) => onChange("description", e.target.value)} />
      </FormField>

      <div className="lesson-resources">
        <div className="lesson-resources-head">
          <span>Resources</span>
          <button type="button" className="fa-outline-btn lesson-add-resource-btn" onClick={onAddResource}>
            <Icon name="plus" size={13} />
            Add Resource
          </button>
        </div>

        {lesson.resources.length === 0 ? (
          <p className="lesson-resources-empty">No resources added yet.</p>
        ) : (
          <div className="lesson-resources-list">
            {lesson.resources.map((resource) => (
              <ResourceUploader
                key={resource.id}
                resource={resource}
                error={resourceErrors?.[resource.id]}
                onChange={(field, value) => onResourceChange(resource.id, field, value)}
                onRemove={() => onResourceRemove(resource.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
