import FormField from "../../../../components/FormField.jsx";
import ImageUploader from "../../../../components/ImageUploader.jsx";
import RichTextEditor from "../../../../components/RichTextEditor.jsx";
import Icon from "../../../../components/Icon.jsx";
import { COURSE_CATEGORIES, DIFFICULTY_LEVELS, COURSE_STATUSES } from "../courseWizardData.js";

export default function CourseDetailsStep({ data, errors, onChange, onCancel, onSaveDraft, onNext, saving }) {
  return (
    <div className="cw-step-body">
      <div className="cw-thumb-row">
        <ImageUploader
          label="Course Thumbnail"
          hint="PNG or JPG, up to 2MB"
          shape="wide"
          value={data.thumbnail}
          onChange={(dataUrl) => onChange("thumbnail", dataUrl)}
          onRemove={() => onChange("thumbnail", "")}
        />
      </div>

      <div className="form-row">
        <FormField label="Course Category *" error={errors.category}>
          <select value={data.category} onChange={(e) => onChange("category", e.target.value)}>
            <option value="">Select category</option>
            {COURSE_CATEGORIES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Course Code (Auto Generated)">
          <input type="text" value={data.code} readOnly disabled />
        </FormField>
      </div>

      <FormField label="Course Name *" error={errors.name}>
        <input type="text" value={data.name} onChange={(e) => onChange("name", e.target.value)} placeholder="e.g. Advanced Negotiation Tactics" />
      </FormField>

      <FormField label="Description *" error={errors.description}>
        <RichTextEditor
          value={data.description}
          onChange={(html) => onChange("description", html)}
          placeholder="Describe what learners will gain from this course..."
          error={errors.description}
        />
      </FormField>

      <FormField label="Difficulty Level">
        <div className="seg-group">
          {DIFFICULTY_LEVELS.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`seg-chip${data.difficulty === opt ? " is-active" : ""}`}
              onClick={() => onChange("difficulty", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>

      <div className="form-row">
        <FormField label="Duration">
          <div className="cw-duration-row">
            <input type="number" min="0" value={data.durationHours} onChange={(e) => onChange("durationHours", e.target.value)} placeholder="Hours" />
            <input type="number" min="0" max="59" value={data.durationMinutes} onChange={(e) => onChange("durationMinutes", e.target.value)} placeholder="Minutes" />
          </div>
        </FormField>
        <FormField label="Estimated Completion Days">
          <input type="number" min="0" value={data.estimatedDays} onChange={(e) => onChange("estimatedDays", e.target.value)} />
        </FormField>
      </div>

      <FormField label="Status">
        <div className="seg-group">
          {COURSE_STATUSES.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`seg-chip${data.status === opt ? " is-active" : ""}${
                data.status === opt ? (opt === "Published" ? " tone-success" : opt === "Archived" ? " tone-danger" : "") : ""
              }`}
              onClick={() => onChange("status", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>

      <div className="cw-step-footer">
        <button type="button" className="cl-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <div className="cw-step-footer-right">
          <button type="button" className="cl-btn" onClick={onSaveDraft} disabled={saving}>
            <Icon name="download" size={15} style={{ transform: "rotate(90deg)" }} />
            Save Draft
          </button>
          <button type="button" className="dash-primary-btn" onClick={onNext} disabled={saving}>
            Next
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
